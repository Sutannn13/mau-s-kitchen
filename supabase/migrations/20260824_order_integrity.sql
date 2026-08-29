-- MAU'S Kitchen — integritas retry checkout dan update menu atomik.

begin;

alter table public.orders add column if not exists idempotency_key uuid;
alter table public.orders add column if not exists request_fingerprint text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_request_fingerprint_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_request_fingerprint_check
      check (request_fingerprint is null or length(request_fingerprint) = 64);
  end if;
end $$;

create unique index if not exists orders_idempotency_key_idx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

create or replace function public.insert_order_with_items(
  p_order jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_order_id uuid;
begin
  if jsonb_typeof(p_order) <> 'object'
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'Invalid order payload';
  end if;

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
    total,
    payment_method,
    payment_proof_url,
    payment_claimed_at,
    status,
    admin_note
  )
  values (
    p_order ->> 'code',
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
    (p_order ->> 'total')::integer,
    p_order ->> 'payment_method',
    p_order ->> 'payment_proof_url',
    (p_order ->> 'payment_claimed_at')::timestamptz,
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

  return new_order_id;
end;
$$;

revoke all on function public.insert_order_with_items(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.insert_order_with_items(jsonb, jsonb)
  to service_role;

create or replace function public.admin_update_menu_item(
  p_item_id text,
  p_item_patch jsonb,
  p_variants jsonb,
  p_addon_ids jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if jsonb_typeof(coalesce(p_item_patch, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid item patch';
  end if;
  if p_variants is not null and jsonb_typeof(p_variants) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid variants';
  end if;
  if p_addon_ids is not null and jsonb_typeof(p_addon_ids) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid add-ons';
  end if;

  update public.menu_items
  set
    category_id = case when p_item_patch ? 'category_id'
      then p_item_patch ->> 'category_id' else category_id end,
    name = case when p_item_patch ? 'name'
      then p_item_patch ->> 'name' else name end,
    description = case when p_item_patch ? 'description'
      then p_item_patch ->> 'description' else description end,
    base_price = case when p_item_patch ? 'base_price'
      then (p_item_patch ->> 'base_price')::integer else base_price end,
    unit = case when p_item_patch ? 'unit'
      then p_item_patch ->> 'unit' else unit end,
    is_best_seller = case when p_item_patch ? 'is_best_seller'
      then (p_item_patch ->> 'is_best_seller')::boolean else is_best_seller end,
    is_addon_item = case when p_item_patch ? 'is_addon_item'
      then (p_item_patch ->> 'is_addon_item')::boolean else is_addon_item end,
    sort_order = case when p_item_patch ? 'sort_order'
      then (p_item_patch ->> 'sort_order')::integer else sort_order end,
    available = case when p_item_patch ? 'available'
      then (p_item_patch ->> 'available')::boolean else available end,
    archived = case when p_item_patch ? 'archived'
      then (p_item_patch ->> 'archived')::boolean else archived end
  where id = p_item_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Menu item not found';
  end if;

  if p_variants is not null then
    delete from public.menu_variants where item_id = p_item_id;
    insert into public.menu_variants (id, item_id, name, price, sort_order)
    select
      variant ->> 'id',
      p_item_id,
      variant ->> 'name',
      (variant ->> 'price')::integer,
      (variant ->> 'sort_order')::integer
    from jsonb_array_elements(p_variants) as variants(variant);
  end if;

  if p_addon_ids is not null then
    delete from public.menu_item_addons where item_id = p_item_id;
    insert into public.menu_item_addons (item_id, addon_id)
    select p_item_id, addon_id
    from jsonb_array_elements_text(p_addon_ids) as addons(addon_id);
  end if;
end;
$$;

revoke all on function public.admin_update_menu_item(text, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_update_menu_item(text, jsonb, jsonb, jsonb)
  to service_role;

commit;
