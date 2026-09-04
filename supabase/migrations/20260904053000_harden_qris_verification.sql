-- Bind every verified static-QRIS mutation to one order and require in-app proof.
-- Urutan aman untuk project lama: kolom dan indeks dulu, lalu RPC v2 dan
-- trigger yang lebih ketat. Aman dijalankan ulang (idempoten).

begin;

alter table public.orders
  add column if not exists payment_reference text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_payment_reference_valid'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_reference_valid
      check (
        payment_reference is null
        or (
          payment_method = 'qris'
          and payment_reference = upper(btrim(payment_reference))
          and char_length(payment_reference) between 4 and 100
          and payment_reference ~ '^[A-Z0-9][A-Z0-9 ._:/#-]*$'
        )
      );
  end if;
end $$;

create unique index if not exists orders_payment_reference_idx
  on public.orders (payment_reference)
  where payment_reference is not null;

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
    payment_reference,
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
    null,
    null,
    null,
    null,
    'BARU',
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

create or replace function public.enforce_manual_payment_verification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'BARU'
      or new.payment_proof_url is not null
      or new.payment_claimed_at is not null
      or new.payment_verified_at is not null
      or new.payment_reference is not null then
      raise exception using
        errcode = '23514',
        message = 'New orders must start unpaid with BARU status';
    end if;
    return new;
  end if;

  if new.payment_method is distinct from old.payment_method then
    raise exception using
      errcode = '23514',
      message = 'Payment method is immutable';
  end if;

  if old.payment_proof_url is not null
    and new.payment_proof_url is distinct from old.payment_proof_url then
    raise exception using
      errcode = '23514',
      message = 'Payment proof is immutable after submission';
  end if;

  if old.payment_claimed_at is not null
    and new.payment_claimed_at is distinct from old.payment_claimed_at then
    raise exception using
      errcode = '23514',
      message = 'Payment claim time is immutable';
  end if;

  if old.payment_reference is not null
    and new.payment_reference is distinct from old.payment_reference then
    raise exception using
      errcode = '23514',
      message = 'Payment reference is immutable after verification';
  end if;

  if old.payment_verified_at is not null
    and new.payment_verified_at is distinct from old.payment_verified_at then
    raise exception using
      errcode = '23514',
      message = 'Payment verification time is immutable';
  end if;

  if old.status = 'BARU'
    and new.status not in ('BARU', 'BATAL')
    and new.payment_method = 'qris'
    and (
      nullif(btrim(new.payment_proof_url), '') is null
      or new.payment_verified_at is null
      or nullif(btrim(new.payment_reference), '') is null
    ) then
    raise exception using
      errcode = '23514',
      message = 'QRIS proof, verification, and payment reference required';
  end if;

  if old.status = 'BARU'
    and new.status not in ('BARU', 'BATAL')
    and new.payment_method = 'transfer'
    and (
      (new.payment_claimed_at is null and new.payment_proof_url is null)
      or new.payment_verified_at is null
    ) then
    raise exception using
      errcode = '23514',
      message = 'Manual payment verification required';
  end if;

  if old.status <> 'BARU'
    and (
      new.payment_claimed_at is distinct from old.payment_claimed_at
      or new.payment_proof_url is distinct from old.payment_proof_url
      or new.payment_reference is distinct from old.payment_reference
      or new.payment_verified_at is distinct from old.payment_verified_at
    ) then
    raise exception using
      errcode = '23514',
      message = 'Verified payment audit fields are immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_manual_payment_verification on public.orders;
drop trigger if exists orders_enforce_initial_payment_state on public.orders;
create trigger orders_enforce_initial_payment_state
  before insert on public.orders
  for each row execute function public.enforce_manual_payment_verification();
create trigger orders_enforce_manual_payment_verification
  before update of status, payment_method, payment_proof_url, payment_claimed_at,
    payment_reference, payment_verified_at on public.orders
  for each row execute function public.enforce_manual_payment_verification();

revoke all on function public.enforce_manual_payment_verification()
  from public, anon, authenticated;

commit;
