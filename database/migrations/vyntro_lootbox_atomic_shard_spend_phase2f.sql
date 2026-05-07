begin;

create or replace function public.spend_shards_if_balance_available(
  p_auth_user_id uuid,
  p_amount integer,
  p_source_type text,
  p_source_ref text,
  p_action text,
  p_reason text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(ok boolean, ledger_id uuid, balance_after integer, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer := 0;
  v_existing_ledger_id uuid;
  v_ledger_id uuid;
  v_source_dedupe_key text;
begin
  if p_auth_user_id is null then
    return query select false, null::uuid, 0, 'Missing auth user id.'::text;
    return;
  end if;

  if p_amount is null or p_amount <= 0 then
    return query select false, null::uuid, 0, 'Shard spend amount must be positive.'::text;
    return;
  end if;

  if nullif(trim(coalesce(p_source_type, '')), '') is null
    or nullif(trim(coalesce(p_source_ref, '')), '') is null
    or nullif(trim(coalesce(p_action, '')), '') is null
    or nullif(trim(coalesce(p_reason, '')), '') is null
  then
    return query select false, null::uuid, 0, 'Shard spend source is incomplete.'::text;
    return;
  end if;

  v_source_dedupe_key := concat(p_source_type, ':', p_source_ref, ':', p_action);

  perform pg_advisory_xact_lock(hashtextextended(p_auth_user_id::text, 0));

  select coalesce(sum(amount), 0)::integer
  into v_balance
  from public.shard_ledger
  where auth_user_id = p_auth_user_id;

  select id
  into v_existing_ledger_id
  from public.shard_ledger
  where auth_user_id = p_auth_user_id
    and source_dedupe_key = v_source_dedupe_key
  limit 1;

  if v_existing_ledger_id is not null then
    return query select true, v_existing_ledger_id, v_balance, null::text;
    return;
  end if;

  if v_balance < p_amount then
    return query select false, null::uuid, v_balance, 'Insufficient shard balance.'::text;
    return;
  end if;

  insert into public.shard_ledger (
    auth_user_id,
    amount,
    source_type,
    source_ref,
    source_dedupe_key,
    reason,
    metadata
  )
  values (
    p_auth_user_id,
    -p_amount,
    p_source_type,
    p_source_ref,
    v_source_dedupe_key,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_ledger_id;

  return query select true, v_ledger_id, (v_balance - p_amount), null::text;
end;
$$;

revoke all on function public.spend_shards_if_balance_available(uuid, integer, text, text, text, text, jsonb) from public;
grant execute on function public.spend_shards_if_balance_available(uuid, integer, text, text, text, text, jsonb) to service_role;

commit;
