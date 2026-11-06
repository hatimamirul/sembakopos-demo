-- Run in Supabase SQL Editor. Never expose service_role keys in browser.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role text not null default 'cashier' check (role in ('admin','cashier')),
 created_at timestamptz not null default now()
);
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 sku text unique,
 price numeric(14,2) not null check (price >= 0),
 stock numeric(14,3) not null default 0 check (stock >= 0),
 active boolean not null default true,
 updated_at timestamptz not null default now()
);
create table if not exists public.sales (
 id uuid primary key default gen_random_uuid(),
 cashier_id uuid not null references public.profiles(id),
 customer_name text,
 sold_at timestamptz not null default now(),
 total numeric(14,2) not null check (total >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.sale_items (
 id uuid primary key default gen_random_uuid(),
 sale_id uuid not null references public.sales(id) on delete cascade,
 product_id uuid not null references public.products(id),
 quantity numeric(14,3) not null check (quantity > 0),
 unit_price numeric(14,2) not null check (unit_price >= 0),
 subtotal numeric(14,2) generated always as (quantity * unit_price) stored
);
create index if not exists sales_sold_at_idx on public.sales(sold_at desc);
create index if not exists sale_items_sale_id_idx on public.sale_items(sale_id);
create index if not exists sales_cashier_idx on public.sales(cashier_id);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
create policy "profiles self or admin read" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "admin manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products authenticated read" on public.products for select to authenticated using (true);
create policy "products admin manage" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sales self or admin read" on public.sales for select to authenticated using (cashier_id = (select auth.uid()) or public.is_admin());
create policy "items self or admin read" on public.sale_items for select to authenticated using (
 exists (select 1 from public.sales s where s.id = sale_id and (s.cashier_id = (select auth.uid()) or public.is_admin()))
);
-- Sales and stock mutations are exclusively through an atomic database function.
create or replace function public.checkout(p_items jsonb, p_customer_name text default null, p_sold_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_sale uuid; v_total numeric(14,2) := 0;
 v_item record; v_product record; v_count int;
begin
 if v_user is null or not exists(select 1 from public.profiles where id=v_user and role in ('admin','cashier')) then
   raise exception 'Not authorized';
 end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
   raise exception 'Invalid cart';
 end if;
 -- Lock in deterministic order to prevent concurrent stock races and deadlocks.
 for v_item in
   select (x->>'product_id')::uuid as product_id, sum((x->>'quantity')::numeric) as qty
   from jsonb_array_elements(p_items) x
   group by (x->>'product_id')::uuid order by product_id
 loop
   if v_item.qty is null or v_item.qty <= 0 then raise exception 'Invalid quantity'; end if;
   select * into v_product from public.products where id=v_item.product_id and active for update;
   if not found or v_product.stock < v_item.qty then raise exception 'Product unavailable or insufficient stock'; end if;
   v_total := v_total + (v_product.price * v_item.qty);
 end loop;
 insert into public.sales(cashier_id,customer_name,sold_at,total)
 values(v_user,nullif(trim(p_customer_name),''),coalesce(p_sold_at,now()),v_total) returning id into v_sale;
 for v_item in
   select (x->>'product_id')::uuid as product_id, sum((x->>'quantity')::numeric) as qty
   from jsonb_array_elements(p_items) x
   group by (x->>'product_id')::uuid order by product_id
 loop
   select * into v_product from public.products where id=v_item.product_id;
   update public.products set stock=stock-v_item.qty, updated_at=now() where id=v_item.product_id;
   insert into public.sale_items(sale_id,product_id,quantity,unit_price)
   values(v_sale,v_item.product_id,v_item.qty,v_product.price);
 end loop;
 return v_sale;
end; $$;
revoke all on function public.checkout(jsonb,text,timestamptz) from public, anon;
grant execute on function public.checkout(jsonb,text,timestamptz) to authenticated;
-- Assign first admin through trusted SQL editor after user signs up:
-- insert into public.profiles(id,display_name,role) values ('USER_UUID','Owner','admin');
-- Other users should be provisioned by an admin through a trusted server workflow.
