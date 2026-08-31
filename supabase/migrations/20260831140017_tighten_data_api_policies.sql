-- Keep browser-facing Data API access read-only. Admin routes use the
-- service role only after the server verifies the configured email allowlist.

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

-- Drop the legacy duplicate only when a column-level UNIQUE constraint owns
-- the replacement index. Older databases may have only the legacy index.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'u'
      and conname = 'orders_public_token_key'
  ) then
    drop index if exists public.orders_public_token_idx;
  end if;
end $$;

commit;
