-- =====================================================================
-- Morrales y Algo Más — esquema base
--
-- Reconstruido a partir del esquema real del proyecto (tablas, columnas,
-- valores por defecto y restricciones). Ejecutar primero; después las
-- migraciones siguientes (RLS seguro y allowlist de administradores).
-- No incluye datos de ejemplo salvo las categorías iniciales.
-- =====================================================================

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id                text primary key,
  name              text not null,
  price             text not null,                 -- precio formateado COP, ej. "$189.900"
  promo_price       text,
  promo_end_date    timestamptz,
  category          text not null,
  stock             integer not null default 0,
  description       text not null default '',
  images            jsonb not null default '[]'::jsonb,
  variants          jsonb not null default '[]'::jsonb,
  material_type     text,
  dimensions        text,
  weight            text,
  sku               text,
  care_instructions text,
  handmade          boolean default false,
  created_at        timestamptz default now()
);

create table if not exists public.orders (
  id               text primary key,               -- ej. "ORD-3F9A1C2B"
  customer_name    text not null,
  customer_phone   text not null,
  delivery_address text not null,
  payment_method   text not null,
  items            jsonb not null default '[]'::jsonb,
  total_amount     numeric not null default 0,
  status           text not null default 'pending'
                     check (status in ('pending', 'confirmed', 'shipped', 'cancelled')),
  notes            text,
  created_at       timestamptz default now()
);

-- RLS activo desde el inicio; las políticas se definen en la migración de seguridad.
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;

insert into public.categories (name, slug) values
  ('Bolsos', 'bolsos'),
  ('Billeteras', 'billeteras'),
  ('Cinturones', 'cinturones'),
  ('Accesorios', 'accesorios'),
  ('Maletines', 'maletines'),
  ('Morrales', 'morrales'),
  ('Edición Limitada', 'edicion-limitada')
on conflict (name) do nothing;

-- Bucket público para las fotos de productos (la subida la restringe la migración de seguridad).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
