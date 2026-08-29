-- MAU'S Kitchen: jalankan pada project Supabase yang sudah memakai schema lama.

alter table public.orders add column if not exists public_token text;
update public.orders
set public_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where public_token is null;
alter table public.orders alter column public_token set default
  (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));
alter table public.orders alter column public_token set not null;
create unique index if not exists orders_public_token_idx on public.orders (public_token);

drop policy if exists orders_admin_all on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists order_items_admin_all on public.order_items;
create policy "order_items_admin_all"
  on public.order_items for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create table if not exists public.rate_limits (
  key_hash          text primary key,
  window_started_at timestamptz not null default now(),
  hit_count         integer not null default 1 check (hit_count > 0),
  updated_at        timestamptz not null default now()
);
alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_key_hash text,
  p_window_seconds integer,
  p_max_requests integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_window_seconds < 1 or p_max_requests < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.rate_limits (key_hash, window_started_at, hit_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
  set
    hit_count = case
      when public.rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.hit_count + 1
    end,
    window_started_at = case
      when public.rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.rate_limits.window_started_at
    end,
    updated_at = now()
  returning hit_count into current_count;

  delete from public.rate_limits
  where updated_at < now() - interval '1 day';

  return current_count > p_max_requests;
end;
$$;

revoke all on table public.rate_limits from anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  4194304,
  array['image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
