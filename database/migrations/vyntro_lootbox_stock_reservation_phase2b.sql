begin;

create or replace function public.reserve_lootbox_pool_item_stock(
  p_pool_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reserved boolean := false;
  v_unlimited boolean := false;
begin
  update public.lootbox_pool_items
  set
    stock = stock - 1,
    updated_at = now()
  where id = p_pool_item_id
    and active = true
    and unlimited_stock = false
    and stock is not null
    and stock > 0
  returning true into v_reserved;

  if coalesce(v_reserved, false) then
    return true;
  end if;

  select true
  into v_unlimited
  from public.lootbox_pool_items
  where id = p_pool_item_id
    and active = true
    and (unlimited_stock = true or stock is null)
  limit 1;

  return coalesce(v_unlimited, false);
end;
$$;

create or replace function public.restore_lootbox_pool_item_stock(
  p_pool_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restored boolean := false;
begin
  update public.lootbox_pool_items
  set
    stock = stock + 1,
    updated_at = now()
  where id = p_pool_item_id
    and unlimited_stock = false
    and stock is not null
  returning true into v_restored;

  return coalesce(v_restored, false);
end;
$$;

revoke all on function public.reserve_lootbox_pool_item_stock(uuid) from public;
revoke all on function public.restore_lootbox_pool_item_stock(uuid) from public;

grant execute on function public.reserve_lootbox_pool_item_stock(uuid) to service_role;
grant execute on function public.restore_lootbox_pool_item_stock(uuid) to service_role;

commit;
