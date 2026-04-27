do $$
begin
  if to_regclass('public.quests') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quests'
      and column_name = 'xp'
  ) then
    execute 'comment on column public.quests.xp is ''Project-local points budget for campaign/reward presentation. Global VYNTRO XP must be recomputed by the xp-economy-v1 policy and must not trust this value directly.''';
  end if;

  if to_regclass('public.xp_events') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'xp_events'
      and column_name = 'effective_xp'
  ) then
    execute 'comment on column public.xp_events.effective_xp is ''Canonical global VYNTRO XP issued after policy caps, duplicate checks, sybil checks and source-specific limits.''';
  end if;

  if to_regclass('public.xp_events') is not null and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'xp_events'
      and column_name = 'metadata'
  ) then
    execute 'comment on column public.xp_events.metadata is ''Stores the XP policy version, server-side claim guard and project-local point context used when the event was issued.''';
  end if;
end $$;
