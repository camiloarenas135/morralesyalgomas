-- =====================================================================
-- Morrales y Algo Más — validar total_amount e items contra products
--
-- Hallazgo 1 (auditoría): orders_public_insert solo revisaba longitudes y
-- rangos, nunca que total_amount coincidiera con el precio real de los
-- productos. Cualquiera con la anon key podía insertar un pedido con
-- cifras inventadas, envenenando AdminStats (Ingresos Totales, gráfica
-- semanal) sin que mediara ninguna transacción real.
--
-- Hallazgo 2 (auditoría): el único rate limit era un cooldown de 2s en
-- localStorage del propio navegador — trivial de saltar pegándole
-- directo a la API. Se agrega un límite server-side simple por teléfono.
--
-- Esta migración ignora por completo el campo "price" que manda el
-- cliente en cada item; solo confía en productId + quantity, y recalcula
-- el precio real contra public.products (promo_price si existe, si no
-- price — igual a como App.tsx decide el precio al agregar al carrito).
-- =====================================================================

create or replace function public.validate_order_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  item          jsonb;
  product_row   public.products%rowtype;
  item_qty      numeric;
  effective_price numeric;
  computed_total  numeric := 0;
  recent_orders   int;
begin
  if jsonb_typeof(new.items) is distinct from 'array' or jsonb_array_length(new.items) = 0 then
    raise exception 'El pedido no tiene artículos válidos.';
  end if;

  for item in select * from jsonb_array_elements(new.items)
  loop
    if item->>'productId' is null then
      raise exception 'Falta el producto de un artículo del pedido.';
    end if;

    select * into product_row from public.products where id = (item->>'productId');
    if not found then
      raise exception 'El producto % ya no existe en el catálogo.', item->>'productId';
    end if;

    item_qty := (item->>'quantity')::numeric;
    if item_qty is null or item_qty <= 0 or item_qty > greatest(product_row.stock, 0) then
      raise exception 'Cantidad inválida para "%": pediste %, disponible %.',
        product_row.name, item_qty, product_row.stock;
    end if;

    -- Mismo criterio que App.tsx: promo_price si existe, si no price.
    effective_price := coalesce(
      nullif(regexp_replace(coalesce(product_row.promo_price, ''), '[^0-9]', '', 'g'), '')::numeric,
      nullif(regexp_replace(coalesce(product_row.price, ''), '[^0-9]', '', 'g'), '')::numeric,
      0
    );

    computed_total := computed_total + (effective_price * item_qty);
  end loop;

  if new.total_amount <> computed_total then
    raise exception 'El total del pedido (%) no coincide con el precio real de los artículos (%).',
      new.total_amount, computed_total;
  end if;

  -- Límite simple contra pedidos masivos: máx. 5 pedidos por el mismo
  -- teléfono en 10 minutos. No sustituye un WAF, pero frena scripts
  -- ingenuos que llaman directo a la API sin pasar por el rate limit
  -- (cosmético) del navegador.
  select count(*) into recent_orders
  from public.orders
  where customer_phone = new.customer_phone
    and created_at > now() - interval '10 minutes';

  if recent_orders >= 5 then
    raise exception 'Demasiados pedidos recientes con este número de teléfono. Intenta de nuevo en unos minutos.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_order_total_trigger on public.orders;
create trigger validate_order_total_trigger
  before insert on public.orders
  for each row execute function public.validate_order_total();
