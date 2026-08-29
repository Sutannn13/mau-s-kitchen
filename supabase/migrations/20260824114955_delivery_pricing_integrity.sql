-- Remote migration version: 20260824114955.
-- Enforce delivery-pricing invariants without inventing fees for legacy orders.

begin;

-- Pickup never has a shipping charge. This also repairs historical test rows
-- where an admin could previously enter a fee for pickup orders.
update public.orders
set
  delivery_fee = 0,
  total = subtotal
where order_type = 'ambil'
  and (delivery_fee is distinct from 0 or total is distinct from subtotal);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_delivery_fee_nonnegative'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_delivery_fee_nonnegative
      check (delivery_fee is null or delivery_fee >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_pickup_delivery_fee_zero'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_pickup_delivery_fee_zero
      check (order_type <> 'ambil' or delivery_fee = 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_total_matches_components'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_total_matches_components
      check (total = subtotal + coalesce(delivery_fee, 0));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_payment_requires_final_total'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_payment_requires_final_total
      check (
        order_type <> 'antar'
        or delivery_fee is not null
        or (payment_claimed_at is null and payment_proof_url is null)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_confirmed_delivery_requires_fee'
      and conrelid = 'public.orders'::regclass
  ) then
    -- Two completed cash orders predate fee capture. NOT VALID preserves that
    -- history while PostgreSQL still enforces the rule for new/updated rows.
    alter table public.orders
      add constraint orders_confirmed_delivery_requires_fee
      check (
        order_type <> 'antar'
        or status in ('BARU', 'BATAL')
        or delivery_fee is not null
      ) not valid;
  end if;
end $$;

commit;
