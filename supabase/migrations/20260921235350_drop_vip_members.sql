-- =====================================================================
-- Morrales y Algo Más — eliminar vip_members
--
-- La tabla vip_members exponía el WhatsApp de los clientes (dato personal,
-- Ley 1581/2012) sin aportar nada que no se pueda derivar de orders.items
-- + orders.customer_phone. AdminCustomers ahora arma el listado de
-- clientes a partir de los pedidos (ver src/utils/customers.ts).
--
-- En esta línea de migraciones vip_members nunca llega a crearse (el
-- esquema base ya nace sin ella), así que este paso es un no-op seguro
-- que documenta la decisión y mantiene el historial alineado con las
-- migraciones ya aplicadas en el proyecto remoto de Supabase.
-- =====================================================================

drop table if exists public.vip_members cascade;
