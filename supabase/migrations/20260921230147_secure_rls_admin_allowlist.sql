-- =====================================================================
-- Morrales y Algo Más — RLS seguro + allowlist de administradores
--
-- Antes: todas las políticas eran USING (true) para el rol public, así que
-- cualquiera con la anon key podía leer/editar/borrar productos y pedidos, y
-- subir archivos al bucket.
-- Ahora: lectura pública solo del catálogo; los pedidos se pueden crear (con
-- validación) pero solo el admin los lee o modifica.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Allowlist de administradores
-- ---------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key check (email = lower(trim(email)))
);

-- RLS activo y SIN políticas: la API no puede leer ni escribir esta tabla.
-- Solo is_admin() (SECURITY DEFINER) la consulta.
alter table public.admin_emails enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Aviso del advisor: función SECURITY DEFINER ejecutable por anon/authenticated.
-- rls_auto_enable() la crea Supabase en proyectos nuevos; si no existe, se omite.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Limpiar políticas abiertas
-- ---------------------------------------------------------------------
drop policy if exists "Manage Categories"        on public.categories;
drop policy if exists "Public Read Categories"   on public.categories;
drop policy if exists "Manage Products"          on public.products;
drop policy if exists "Public Read Products"     on public.products;
drop policy if exists "Manage Orders"            on public.orders;
drop policy if exists "Public Insert Orders"     on public.orders;
drop policy if exists "Read Orders"              on public.orders;

-- ---------------------------------------------------------------------
-- 3. Catálogo: lectura pública, escritura solo admin
-- ---------------------------------------------------------------------
create policy products_public_read   on public.products   for select to anon, authenticated using (true);
create policy categories_public_read on public.categories for select to anon, authenticated using (true);

do $$
declare
  t text;
begin
  foreach t in array array['products', 'categories', 'orders'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_admin()))', t || '_admin_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t || '_admin_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_admin()))', t || '_admin_delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Pedidos: cualquiera crea (validado), solo el admin lee
-- ---------------------------------------------------------------------
create policy orders_admin_read on public.orders for select to authenticated
  using ((select public.is_admin()));

create policy orders_public_insert on public.orders for insert to anon
  with check (
    length(id) between 3 and 40
    and length(trim(customer_name)) between 3 and 100
    and length(trim(customer_phone)) between 8 and 20
    and length(trim(delivery_address)) between 8 and 300
    and length(payment_method) between 1 and 60
    and coalesce(length(notes), 0) <= 500
    and jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 50
    and total_amount >= 0 and total_amount <= 50000000
    and status = 'pending'
  );

-- ---------------------------------------------------------------------
-- 5. Storage: bucket público para servir fotos, subida solo admin
-- ---------------------------------------------------------------------
drop policy if exists "Public Read Product Images"   on storage.objects;
drop policy if exists "Public Upload Product Images" on storage.objects;

-- Un bucket público sirve sus URLs sin política SELECT; esta política es solo
-- para que el admin pueda listar/reemplazar/borrar desde la API.
create policy product_images_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy product_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'product-images';
