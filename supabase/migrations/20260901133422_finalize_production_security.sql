begin;

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges
  on table
    public.orders,
    public.order_items,
    public.order_daily_sequences,
    public.rate_limits
  from anon, authenticated;

grant all privileges
  on table
    public.orders,
    public.order_items,
    public.order_daily_sequences,
    public.rate_limits
  to service_role;

revoke insert, update, delete, truncate, references, trigger
  on table
    public.menu_categories,
    public.menu_items,
    public.menu_variants,
    public.menu_addons,
    public.menu_item_addons,
    public.menu_overrides
  from anon, authenticated;

grant select
  on table
    public.menu_categories,
    public.menu_items,
    public.menu_variants,
    public.menu_addons,
    public.menu_item_addons,
    public.menu_overrides
  to anon, authenticated;

grant all privileges
  on table
    public.menu_categories,
    public.menu_items,
    public.menu_variants,
    public.menu_addons,
    public.menu_item_addons,
    public.menu_overrides
  to service_role;

drop policy if exists orders_admin_all on public.orders;
drop policy if exists order_items_admin_all on public.order_items;
drop policy if exists menu_admin_all on public.menu_items;
drop policy if exists menu_categories_admin_all on public.menu_categories;
drop policy if exists menu_variants_admin_all on public.menu_variants;
drop policy if exists menu_addons_admin_all on public.menu_addons;
drop policy if exists menu_item_addons_admin_all on public.menu_item_addons;

drop policy if exists menu_public_read on public.menu_items;
create policy "menu_public_read"
  on public.menu_items for select
  to anon, authenticated
  using (archived = false);

drop policy if exists menu_categories_public_read on public.menu_categories;
create policy "menu_categories_public_read"
  on public.menu_categories for select
  to anon, authenticated
  using (archived = false);

drop policy if exists menu_variants_public_read on public.menu_variants;
create policy "menu_variants_public_read"
  on public.menu_variants for select
  to anon, authenticated
  using (true);

drop policy if exists menu_addons_public_read on public.menu_addons;
create policy "menu_addons_public_read"
  on public.menu_addons for select
  to anon, authenticated
  using (true);

drop policy if exists menu_item_addons_public_read on public.menu_item_addons;
create policy "menu_item_addons_public_read"
  on public.menu_item_addons for select
  to anon, authenticated
  using (true);

drop policy if exists menu_overrides_public_read on public.menu_overrides;
create policy "menu_overrides_public_read"
  on public.menu_overrides for select
  to anon, authenticated
  using (true);

create index if not exists menu_item_addons_addon_id_idx
  on public.menu_item_addons (addon_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at()
  from public, anon, authenticated;
grant execute on function public.touch_updated_at()
  to service_role;

create or replace function public.admin_create_menu_item(
  p_item jsonb,
  p_variants jsonb,
  p_addon_ids jsonb
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_item_id text;
begin
  if jsonb_typeof(p_item) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Invalid menu item';
  end if;
  if jsonb_typeof(p_variants) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Invalid variants';
  end if;
  if jsonb_typeof(p_addon_ids) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Invalid add-ons';
  end if;

  new_item_id := nullif(p_item ->> 'id', '');
  if new_item_id is null or nullif(p_item ->> 'category_id', '') is null then
    raise exception using errcode = '22023', message = 'Missing menu item identity';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_variants) as variants(variant)
    where jsonb_typeof(variant) <> 'object'
      or nullif(variant ->> 'id', '') is null
      or nullif(variant ->> 'name', '') is null
      or not (variant ? 'price')
      or not (variant ? 'sort_order')
  ) then
    raise exception using errcode = '22023', message = 'Invalid variant';
  end if;

  if (
    select count(*) <> count(distinct variant ->> 'id')
    from jsonb_array_elements(p_variants) as variants(variant)
  ) then
    raise exception using errcode = '22023', message = 'Duplicate variant id';
  end if;

  if (
    select count(*) <> count(distinct addon_id)
    from jsonb_array_elements_text(p_addon_ids) as addons(addon_id)
  ) then
    raise exception using errcode = '22023', message = 'Duplicate add-on id';
  end if;

  if not exists (
    select 1
    from public.menu_categories
    where id = p_item ->> 'category_id'
      and archived = false
  ) then
    raise exception using errcode = '23503', message = 'Category not found or archived';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(p_addon_ids) as addons(addon_id)
    left join public.menu_addons on menu_addons.id = addons.addon_id
    where menu_addons.id is null
  ) then
    raise exception using errcode = '23503', message = 'Add-on not found';
  end if;

  insert into public.menu_items (
    id,
    category_id,
    name,
    description,
    base_price,
    image_path,
    available,
    is_best_seller,
    is_addon_item,
    unit,
    sort_order,
    archived
  )
  values (
    new_item_id,
    p_item ->> 'category_id',
    p_item ->> 'name',
    coalesce(p_item ->> 'description', ''),
    (p_item ->> 'base_price')::integer,
    '',
    true,
    coalesce((p_item ->> 'is_best_seller')::boolean, false),
    coalesce((p_item ->> 'is_addon_item')::boolean, false),
    p_item ->> 'unit',
    coalesce((p_item ->> 'sort_order')::integer, 0),
    false
  );

  insert into public.menu_variants (id, item_id, name, price, sort_order)
  select
    variant ->> 'id',
    new_item_id,
    variant ->> 'name',
    (variant ->> 'price')::integer,
    (variant ->> 'sort_order')::integer
  from jsonb_array_elements(p_variants) as variants(variant);

  insert into public.menu_item_addons (item_id, addon_id)
  select new_item_id, addon_id
  from jsonb_array_elements_text(p_addon_ids) as addons(addon_id);

  return new_item_id;
end;
$$;

revoke all on function public.admin_create_menu_item(jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_create_menu_item(jsonb, jsonb, jsonb)
  to service_role;

-- One service-role-only catalog check keeps the release gate deterministic.
create or replace function public.security_release_audit()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with protected_tables(table_name) as (
    values
      ('orders'),
      ('order_items'),
      ('order_daily_sequences'),
      ('rate_limits')
  ),
  menu_tables(table_name) as (
    values
      ('menu_categories'),
      ('menu_items'),
      ('menu_variants'),
      ('menu_addons'),
      ('menu_item_addons'),
      ('menu_overrides')
  ),
  client_write_policies as (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'orders',
        'order_items',
        'order_daily_sequences',
        'rate_limits',
        'menu_categories',
        'menu_items',
        'menu_variants',
        'menu_addons',
        'menu_item_addons',
        'menu_overrides'
      )
      and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
      and roles && array['public'::name, 'anon'::name, 'authenticated'::name]
  )
  select jsonb_build_object(
    'orders_client_dml_revoked',
    (
      select bool_and(
        not pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'INSERT')
        and not pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'UPDATE')
        and not pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'DELETE')
        and not pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT')
        and not pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE')
        and not pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE')
      )
      from protected_tables
    ),
    'menu_client_dml_revoked',
    (
      select bool_and(
        not pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'INSERT')
        and not pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'UPDATE')
        and not pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'DELETE')
        and not pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT')
        and not pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'UPDATE')
        and not pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'DELETE')
      )
      from menu_tables
    ),
    'menu_client_select_granted',
    (
      select bool_and(
        pg_catalog.has_table_privilege('anon', format('public.%I', table_name), 'SELECT')
        and pg_catalog.has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT')
      )
      from menu_tables
    ),
    'client_write_policies_absent',
    not exists (select 1 from client_write_policies),
    'service_role_table_access',
    (
      select bool_and(
        pg_catalog.has_table_privilege('service_role', format('public.%I', table_name), 'SELECT')
        and pg_catalog.has_table_privilege('service_role', format('public.%I', table_name), 'INSERT')
        and pg_catalog.has_table_privilege('service_role', format('public.%I', table_name), 'UPDATE')
        and pg_catalog.has_table_privilege('service_role', format('public.%I', table_name), 'DELETE')
      )
      from (
        select table_name from protected_tables
        union all
        select table_name from menu_tables
      ) as all_tables
    ),
    'atomic_menu_rpc_locked',
    pg_catalog.has_function_privilege(
      'service_role',
      'public.admin_create_menu_item(jsonb,jsonb,jsonb)',
      'EXECUTE'
    )
    and not pg_catalog.has_function_privilege(
      'anon',
      'public.admin_create_menu_item(jsonb,jsonb,jsonb)',
      'EXECUTE'
    )
    and not pg_catalog.has_function_privilege(
      'authenticated',
      'public.admin_create_menu_item(jsonb,jsonb,jsonb)',
      'EXECUTE'
    )
  );
$$;

revoke all on function public.security_release_audit()
  from public, anon, authenticated;
grant execute on function public.security_release_audit()
  to service_role;

commit;
