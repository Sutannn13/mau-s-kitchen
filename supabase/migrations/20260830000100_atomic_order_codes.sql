-- Allocate MK-YYMMDD-XXX inside the same transaction that inserts the order.
-- This removes count+1 races when many checkouts arrive together.

begin;

create table if not exists public.order_daily_sequences (
  day_key text primary key check (day_key ~ '^[0-9]{6}$'),
  last_value integer not null check (last_value > 0),
  updated_at timestamptz not null default now()
);

alter table public.order_daily_sequences enable row level security;
revoke all on table public.order_daily_sequences from public, anon, authenticated;
grant select, insert, update on table public.order_daily_sequences to service_role;

alter table public.orders
  add column if not exists payment_verified_at timestamptz;

create or replace function public.enforce_manual_payment_verification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'BARU'
    and new.status not in ('BARU', 'BATAL')
    and new.payment_method in ('qris', 'transfer')
    and (
      (new.payment_claimed_at is null and new.payment_proof_url is null)
      or new.payment_verified_at is null
    ) then
    raise exception using
      errcode = '23514',
      message = 'Manual payment verification required';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_manual_payment_verification on public.orders;
create trigger orders_enforce_manual_payment_verification
  before update of status on public.orders
  for each row execute function public.enforce_manual_payment_verification();

revoke all on function public.enforce_manual_payment_verification()
  from public, anon, authenticated;

-- Preserve the highest issued number even when this migration is applied to a
-- project that already has orders. Rows remain after retention purges, so codes
-- are never reused.
insert into public.order_daily_sequences (day_key, last_value)
select
  substring(code from 4 for 6),
  max((substring(code from 11 for 3))::integer)
from public.orders
where code ~ '^MK-[0-9]{6}-[0-9]{3}$'
group by substring(code from 4 for 6)
on conflict (day_key) do update
set
  last_value = greatest(
    public.order_daily_sequences.last_value,
    excluded.last_value
  ),
  updated_at = now();

-- Keep insert_order_with_items intact during rollout: the currently deployed
-- app can continue using v1 until the new app is live.
create or replace function public.insert_order_with_items_v2(
  p_order jsonb,
  p_items jsonb
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_order_id uuid;
  order_day_key text;
  order_sequence integer;
  allocated_code text;
begin
  if jsonb_typeof(p_order) <> 'object'
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Invalid order payload';
  end if;

  order_day_key := to_char(
    transaction_timestamp() at time zone 'Asia/Jakarta',
    'YYMMDD'
  );

  -- ponytail: one row serializes a WIB day's allocation; widen the public code
  -- suffix before volume approaches 999 successful orders per day.
  insert into public.order_daily_sequences (day_key, last_value)
  values (order_day_key, 1)
  on conflict (day_key) do update
  set
    last_value = public.order_daily_sequences.last_value + 1,
    updated_at = now()
  returning last_value into order_sequence;

  if order_sequence > 999 then
    raise exception using errcode = '54000', message = 'Daily order code capacity exceeded';
  end if;

  allocated_code := 'MK-' || order_day_key || '-' || lpad(order_sequence::text, 3, '0');

  insert into public.orders (
    code,
    public_token,
    idempotency_key,
    request_fingerprint,
    customer_name,
    customer_wa,
    order_type,
    address,
    address_note,
    scheduled_at,
    customer_note,
    subtotal,
    delivery_fee,
    delivery_provider,
    courier_cost,
    total,
    payment_method,
    payment_proof_url,
    payment_claimed_at,
    payment_verified_at,
    status,
    admin_note
  )
  values (
    allocated_code,
    p_order ->> 'public_token',
    (p_order ->> 'idempotency_key')::uuid,
    p_order ->> 'request_fingerprint',
    p_order ->> 'customer_name',
    p_order ->> 'customer_wa',
    p_order ->> 'order_type',
    p_order ->> 'address',
    p_order ->> 'address_note',
    (p_order ->> 'scheduled_at')::timestamptz,
    p_order ->> 'customer_note',
    (p_order ->> 'subtotal')::integer,
    (p_order ->> 'delivery_fee')::integer,
    p_order ->> 'delivery_provider',
    (p_order ->> 'courier_cost')::integer,
    (p_order ->> 'total')::integer,
    p_order ->> 'payment_method',
    p_order ->> 'payment_proof_url',
    (p_order ->> 'payment_claimed_at')::timestamptz,
    null,
    p_order ->> 'status',
    p_order ->> 'admin_note'
  )
  returning id into new_order_id;

  insert into public.order_items (
    order_id,
    item_id,
    item_name,
    variant_id,
    variant_name,
    unit_price,
    add_ons,
    note,
    quantity,
    subtotal
  )
  select
    new_order_id,
    item ->> 'item_id',
    item ->> 'item_name',
    item ->> 'variant_id',
    item ->> 'variant_name',
    (item ->> 'unit_price')::integer,
    coalesce(item -> 'add_ons', '[]'::jsonb),
    item ->> 'note',
    (item ->> 'quantity')::integer,
    (item ->> 'subtotal')::integer
  from jsonb_array_elements(p_items) as items(item);

  return allocated_code;
end;
$$;

revoke all on function public.insert_order_with_items_v2(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.insert_order_with_items_v2(jsonb, jsonb)
  to service_role;

commit;
