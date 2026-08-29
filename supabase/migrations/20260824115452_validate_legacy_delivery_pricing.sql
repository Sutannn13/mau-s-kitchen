-- Remote migration version: 20260824115452.
-- Fully validate the delivery-status constraint while preserving completed
-- cash orders that predate delivery-fee capture.

begin;

alter table public.orders
  drop constraint if exists orders_confirmed_delivery_requires_fee;

alter table public.orders
  add constraint orders_confirmed_delivery_requires_fee
  check (
    order_type <> 'antar'
    or status in ('BARU', 'BATAL')
    or delivery_fee is not null
    or (
      created_at < timestamptz '2026-08-24 00:00:00+07'
      and status = 'SELESAI'
      and payment_method = 'tunai'
      and payment_claimed_at is null
      and payment_proof_url is null
    )
  );

commit;
