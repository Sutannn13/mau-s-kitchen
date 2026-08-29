-- MAU'S Kitchen — Admin CRUD Menu Mandiri (FR-27).
-- Memindahkan sumber kebenaran katalog dari data/menu.json ke tabel Supabase.
-- data/menu.json tetap di repo sebagai seed awal + fallback read-only bila
-- Supabase tidak tersedia. Lihat docs/10_DATA_MODEL.md §10.3 & docs/05 §5.6.

begin;

-- =====================================================================
-- 1. Tabel: kategori
-- =====================================================================
create table if not exists public.menu_categories (
  id          text primary key,
  name        text not null,
  tagline     text not null default '',
  image       text not null default '',
  sort_order  integer not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- 2. Tabel: item menu (sumber kebenaran utama)
-- =====================================================================
create table if not exists public.menu_items (
  id             text primary key,
  category_id    text not null references public.menu_categories(id) on delete restrict,
  name           text not null,
  description    text not null default '',
  base_price     integer not null check (base_price >= 0),
  image_path     text not null default '',
  available      boolean not null default true,
  is_best_seller boolean not null default false,
  is_addon_item  boolean not null default false,
  unit           text not null check (unit in ('porsi','cup','item')),
  sort_order     integer not null default 0,
  archived       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists menu_items_category_idx on public.menu_items(category_id);

-- =====================================================================
-- 3. Tabel: varian ukuran (mis. Small/Medium ChocoBerry)
-- =====================================================================
create table if not exists public.menu_variants (
  id         text not null,
  item_id    text not null references public.menu_items(id) on delete cascade,
  name       text not null,
  price      integer not null check (price >= 0),
  sort_order integer not null default 0,
  primary key (item_id, id)
);

-- =====================================================================
-- 4. Tabel: add-on global + junction item ↔ add-on
-- =====================================================================
create table if not exists public.menu_addons (
  id    text primary key,
  name  text not null,
  price integer not null check (price >= 0)
);

create table if not exists public.menu_item_addons (
  item_id  text not null references public.menu_items(id) on delete cascade,
  addon_id text not null references public.menu_addons(id) on delete restrict,
  primary key (item_id, addon_id)
);

-- =====================================================================
-- 5. updated_at trigger
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_categories_touch on public.menu_categories;
create trigger menu_categories_touch before update on public.menu_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists menu_items_touch on public.menu_items;
create trigger menu_items_touch before update on public.menu_items
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- 6. Row Level Security
-- =====================================================================
alter table public.menu_categories    enable row level security;
alter table public.menu_items         enable row level security;
alter table public.menu_variants      enable row level security;
alter table public.menu_addons        enable row level security;
alter table public.menu_item_addons   enable row level security;

-- Publik hanya baca item/kategori non-arsip
drop policy if exists menu_public_read on public.menu_items;
create policy "menu_public_read"
  on public.menu_items for select
  using (archived = false);

drop policy if exists menu_categories_public_read on public.menu_categories;
create policy "menu_categories_public_read"
  on public.menu_categories for select
  using (archived = false);

drop policy if exists menu_variants_public_read on public.menu_variants;
create policy "menu_variants_public_read"
  on public.menu_variants for select using (true);

drop policy if exists menu_addons_public_read on public.menu_addons;
create policy "menu_addons_public_read"
  on public.menu_addons for select using (true);

drop policy if exists menu_item_addons_public_read on public.menu_item_addons;
create policy "menu_item_addons_public_read"
  on public.menu_item_addons for select using (true);

-- Admin (custom claim role=admin) full akses
drop policy if exists menu_admin_all on public.menu_items;
create policy "menu_admin_all" on public.menu_items for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_categories_admin_all on public.menu_categories;
create policy "menu_categories_admin_all" on public.menu_categories for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_variants_admin_all on public.menu_variants;
create policy "menu_variants_admin_all" on public.menu_variants for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_addons_admin_all on public.menu_addons;
create policy "menu_addons_admin_all" on public.menu_addons for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists menu_item_addons_admin_all on public.menu_item_addons;
create policy "menu_item_addons_admin_all" on public.menu_item_addons for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================================
-- 7. Storage bucket: menu-images (public read, admin write via service role)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  3145728,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================================
-- 8. Seed dari data/menu.json (idempoten: on conflict do nothing)
-- =====================================================================

-- Kategori
insert into public.menu_categories (id, name, tagline, image, sort_order, archived)
values
  ('taichan',     'Taichan',    'Pedesnya nampol, rasanya nagih!',           '/assets/menu/menu-taichan.jpeg',    1, false),
  ('minuman',     'Minuman',    'Segarnya bikin nagih!',                      '/assets/menu/menu-minuman.jpeg',    2, false),
  ('chocoberry',  'ChocoBerry', 'Fresh Berries, Premium Chocolate',           '/assets/menu/menu-chocoberry.jpeg', 3, false)
on conflict (id) do nothing;

-- Add-on global
insert into public.menu_addons (id, name, price)
values ('pistacio-kunava', 'Pistacio Kunava', 8000)
on conflict (id) do nothing;

-- Item menu
insert into public.menu_items (
  id, category_id, name, description, base_price, image_path,
  available, is_best_seller, is_addon_item, unit, sort_order, archived
)
values
  ('taichan-daging', 'taichan', 'Taichan Daging',
   'Sate ayam bagian daging, dibakar tanpa bumbu kacang, disajikan dengan sambal taichan pedas dan jeruk nipis.',
   35000, '/assets/menu/menu-taichan.jpeg', true, true, false, 'porsi', 1, false),
  ('taichan-kulit', 'taichan', 'Taichan Kulit',
   'Sate kulit ayam renyah dibakar, gurih di luar juicy di dalam, dengan sambal taichan khas.',
   35000, '/assets/menu/menu-taichan.jpeg', true, true, false, 'porsi', 2, false),
  ('lontong', 'taichan', 'Lontong',
   'Lontong pulen, pendamping pas untuk taichan.',
   5000, '/assets/menu/menu-taichan.jpeg', true, false, true, 'porsi', 3, false),
  ('sambel-taichan', 'taichan', 'Sambel Taichan',
   'Sambal taichan ekstra, pedas segar khas MAU''S Kitchen.',
   5000, '/assets/menu/menu-taichan.jpeg', true, false, true, 'porsi', 4, false),
  ('teh-original', 'minuman', 'Teh Original',
   'Es teh original segar, manisnya pas untuk menemani taichan pedas.',
   10000, '/assets/menu/menu-minuman.jpeg', true, false, false, 'cup', 1, false),
  ('thai-tea', 'minuman', 'Thai Tea',
   'Thai tea creamy dengan aroma teh Thailand yang khas.',
   17000, '/assets/menu/menu-minuman.jpeg', true, true, false, 'cup', 2, false),
  ('teh-susu', 'minuman', 'Teh Susu',
   'Perpaduan teh pilihan dan susu, lembut dan bikin nagih.',
   17000, '/assets/menu/menu-minuman.jpeg', true, false, false, 'cup', 3, false),
  ('aren-latte', 'minuman', 'Aren Latte',
   'Kopi susu gula aren dengan manis alami khas gula aren asli.',
   17000, '/assets/menu/menu-minuman.jpeg', true, true, false, 'cup', 4, false),
  ('choco-berry-original', 'chocoberry', 'Choco Berry Original',
   'Strawberry segar disiram coklat premium yang lumer.',
   25000, '/assets/menu/menu-chocoberry.jpeg', true, true, false, 'cup', 1, false),
  ('choco-berry-grape', 'chocoberry', 'Choco Berry Grape',
   'Strawberry & anggur segar disiram coklat premium yang lumer.',
   30000, '/assets/menu/menu-chocoberry.jpeg', true, true, false, 'cup', 2, false),
  ('choco-berry-banana', 'chocoberry', 'Choco Berry Banana',
   'Strawberry & pisang segar disiram coklat premium yang lumer.',
   25000, '/assets/menu/menu-chocoberry.jpeg', true, false, false, 'cup', 3, false)
on conflict (id) do nothing;

-- Varian
insert into public.menu_variants (id, item_id, name, price, sort_order)
values
  ('small',  'choco-berry-original', 'Small',  25000, 1),
  ('medium', 'choco-berry-original', 'Medium', 35000, 2),
  ('small',  'choco-berry-grape',    'Small',  30000, 1),
  ('medium', 'choco-berry-grape',    'Medium', 40000, 2),
  ('small',  'choco-berry-banana',   'Small',  25000, 1),
  ('medium', 'choco-berry-banana',   'Medium', 35000, 2)
on conflict do nothing;

-- Junction item ↔ add-on
insert into public.menu_item_addons (item_id, addon_id)
values
  ('choco-berry-original', 'pistacio-kunava'),
  ('choco-berry-grape',    'pistacio-kunava'),
  ('choco-berry-banana',   'pistacio-kunava')
on conflict do nothing;

commit;

-- Catatan: tabel lama menu_overrides sengaja tidak dihapus pada migration ini
-- untuk kompatibilitas mundur singkat. Setelah semua kode membaca
-- menu_items.available langsung, hapus via migration cleanup terpisah.
