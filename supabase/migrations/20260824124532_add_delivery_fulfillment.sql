-- Remote migration version: 20260824124532.
-- Separate fulfillment from payment: delivery is not synonymous with COD.
-- Existing completed orders remain historical because their provider was not recorded.

begin;

alter table public.orders
  add column if not exists delivery_provider text,
  add column if not exists courier_cost integer;

alter table public.orders
  drop constraint if exists orders_confirmed_delivery_requires_fee,
  drop constraint if exists orders_confirmed_delivery_requires_plan,
  drop constraint if exists orders_payment_requires_final_total,
  drop constraint if exists orders_delivery_provider_valid,
  drop constraint if exists orders_courier_cost_nonnegative,
  drop constraint if exists orders_delivery_fulfillment_coherent,
  drop constraint if exists orders_cash_delivery_internal_only;

alter table public.orders
  add constraint orders_delivery_provider_valid
    check (
      delivery_provider is null
      or delivery_provider in ('internal', 'gosend', 'grabexpress', 'other')
    ),
  add constraint orders_courier_cost_nonnegative
    check (courier_cost is null or courier_cost >= 0),
  add constraint orders_delivery_fulfillment_coherent
    check (
      (order_type = 'ambil' and delivery_provider is null and courier_cost is null)
      or (
        order_type = 'antar'
        and (
          (delivery_provider is null and courier_cost is null)
          or (delivery_provider = 'internal' and courier_cost = 0)
          or (
            delivery_provider in ('gosend', 'grabexpress', 'other')
            and courier_cost is not null
          )
        )
      )
    ),
  add constraint orders_cash_delivery_internal_only
    check (
      order_type <> 'antar'
      or payment_method <> 'tunai'
      or delivery_provider is null
      or delivery_provider = 'internal'
    ),
  add constraint orders_payment_requires_final_total
    check (
      order_type <> 'antar'
      or (
        delivery_fee is not null
        and delivery_provider is not null
        and courier_cost is not null
      )
      or (payment_claimed_at is null and payment_proof_url is null)
    ),
  add constraint orders_confirmed_delivery_requires_plan
    check (
      order_type <> 'antar'
      or status in ('BARU', 'BATAL')
      or (
        delivery_fee is not null
        and delivery_provider is not null
        and courier_cost is not null
      )
      or (
        created_at < timestamptz '2026-08-24 19:18:05+07'
        and status = 'SELESAI'
      )
    );

commit;
