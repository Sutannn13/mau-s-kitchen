-- Repair databases that applied an earlier tightening draft after being
-- upgraded through the legacy index-only public_token migration.

do $$
begin
  if not exists (
    select 1
    from pg_constraint as constraint_row
    join pg_attribute as attribute_row
      on attribute_row.attrelid = constraint_row.conrelid
     and attribute_row.attname = 'public_token'
    where constraint_row.conrelid = 'public.orders'::regclass
      and constraint_row.contype = 'u'
      and constraint_row.conkey = array[attribute_row.attnum]::smallint[]
  ) and to_regclass('public.orders_public_token_idx') is null then
    create unique index orders_public_token_idx
      on public.orders (public_token);
  end if;
end $$;
