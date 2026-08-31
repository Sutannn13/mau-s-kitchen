-- Remote migration version: 20260831133656.
-- Explicit grants are required for projects created after Supabase stopped
-- exposing new public tables to the Data API by default.

begin;

grant usage on schema public to anon, authenticated, service_role;

revoke insert, update, delete, truncate, references, trigger
  on table
    public.menu_categories,
    public.menu_items,
    public.menu_variants,
    public.menu_addons,
    public.menu_item_addons
  from anon, authenticated;

grant select
  on table
    public.menu_categories,
    public.menu_items,
    public.menu_variants,
    public.menu_addons,
    public.menu_item_addons
  to anon, authenticated;

grant all privileges
  on table
    public.menu_categories,
    public.menu_items,
    public.menu_variants,
    public.menu_addons,
    public.menu_item_addons
  to service_role;

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

drop policy if exists orders_admin_all on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists order_items_admin_all on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_admin_all on public.menu_items;
create policy "menu_admin_all" on public.menu_items for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_categories_admin_all on public.menu_categories;
create policy "menu_categories_admin_all" on public.menu_categories for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_variants_admin_all on public.menu_variants;
create policy "menu_variants_admin_all" on public.menu_variants for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_addons_admin_all on public.menu_addons;
create policy "menu_addons_admin_all" on public.menu_addons for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_item_addons_admin_all on public.menu_item_addons;
create policy "menu_item_addons_admin_all" on public.menu_item_addons for all
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

revoke all on function public.admin_update_menu_item(text, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_update_menu_item(text, jsonb, jsonb, jsonb)
  to service_role;

commit;
