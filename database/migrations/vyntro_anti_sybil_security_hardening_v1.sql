begin;

create or replace function public.is_super_admin(check_auth_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = check_auth_user_id
      and au.status = 'active'
      and au.role = 'super_admin'
  );
$$;

create or replace function public.has_project_membership(
  check_auth_user_id uuid,
  check_project_id uuid
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.auth_user_id = check_auth_user_id
      and tm.project_id = check_project_id
      and tm.status in ('active', 'invited')
  )
  or exists (
    select 1
    from public.projects p
    where p.id = check_project_id
      and p.owner_user_id = check_auth_user_id
  );
$$;

create or replace function public.has_project_role(
  check_auth_user_id uuid,
  check_project_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.auth_user_id = check_auth_user_id
      and tm.project_id = check_project_id
      and tm.status = 'active'
      and tm.role = any(allowed_roles)
  )
  or exists (
    select 1
    from public.projects p
    where p.id = check_project_id
      and p.owner_user_id = check_auth_user_id
      and 'owner' = any(allowed_roles)
  );
$$;

alter table public.user_global_reputation enable row level security;
alter table public.user_project_reputation enable row level security;
alter table public.wallet_link_nonces enable row level security;
alter table public.project_wallets enable row level security;
alter table public.project_assets enable row level security;
alter table public.wallet_links enable row level security;
alter table public.xp_events enable row level security;
alter table public.onchain_events enable row level security;
alter table public.xp_stakes enable row level security;
alter table public.reward_distributions enable row level security;
alter table public.trust_snapshots enable row level security;
alter table public.review_flags enable row level security;
alter table public.verification_results enable row level security;

drop policy if exists "authenticated read user global reputation" on public.user_global_reputation;
drop policy if exists "authenticated manage user global reputation" on public.user_global_reputation;
drop policy if exists "user global reputation own read" on public.user_global_reputation;
drop policy if exists "user global reputation bootstrap insert" on public.user_global_reputation;
drop policy if exists "user global reputation super admin mutate" on public.user_global_reputation;

create policy "user global reputation own read"
on public.user_global_reputation
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
);

create policy "user global reputation bootstrap insert"
on public.user_global_reputation
for insert
to authenticated
with check (
  auth.uid() = auth_user_id
  and total_xp = 0
  and active_xp = 0
  and level = 1
  and streak = 0
  and trust_score = 50
  and sybil_score = 0
  and contribution_tier = 'explorer'
  and reputation_rank = 0
  and quests_completed = 0
  and raids_completed = 0
  and rewards_claimed = 0
  and status = 'active'
);

create policy "user global reputation super admin mutate"
on public.user_global_reputation
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read user project reputation" on public.user_project_reputation;
drop policy if exists "authenticated manage user project reputation" on public.user_project_reputation;
drop policy if exists "user project reputation scoped read" on public.user_project_reputation;
drop policy if exists "user project reputation super admin mutate" on public.user_project_reputation;

create policy "user project reputation scoped read"
on public.user_project_reputation
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "user project reputation super admin mutate"
on public.user_project_reputation
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read wallet link nonces" on public.wallet_link_nonces;
drop policy if exists "authenticated manage wallet link nonces" on public.wallet_link_nonces;
drop policy if exists "wallet link nonces own read" on public.wallet_link_nonces;
drop policy if exists "wallet link nonces super admin mutate" on public.wallet_link_nonces;

create policy "wallet link nonces own read"
on public.wallet_link_nonces
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
);

create policy "wallet link nonces super admin mutate"
on public.wallet_link_nonces
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read project wallets" on public.project_wallets;
drop policy if exists "authenticated manage project wallets" on public.project_wallets;
drop policy if exists "project wallets scoped read" on public.project_wallets;
drop policy if exists "project wallets operator mutate" on public.project_wallets;

create policy "project wallets scoped read"
on public.project_wallets
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "project wallets operator mutate"
on public.project_wallets
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);

drop policy if exists "authenticated read project assets" on public.project_assets;
drop policy if exists "authenticated manage project assets" on public.project_assets;
drop policy if exists "project assets scoped read" on public.project_assets;
drop policy if exists "project assets operator mutate" on public.project_assets;

create policy "project assets scoped read"
on public.project_assets
for select
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "project assets operator mutate"
on public.project_assets
for all
to authenticated
using (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
)
with check (
  public.is_super_admin(auth.uid())
  or public.has_project_role(auth.uid(), project_id, array['owner','admin'])
);

drop policy if exists "authenticated read wallet links" on public.wallet_links;
drop policy if exists "authenticated manage wallet links" on public.wallet_links;
drop policy if exists "wallet links own read" on public.wallet_links;
drop policy if exists "wallet links super admin mutate" on public.wallet_links;

create policy "wallet links own read"
on public.wallet_links
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
);

create policy "wallet links super admin mutate"
on public.wallet_links
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read xp events" on public.xp_events;
drop policy if exists "authenticated manage xp events" on public.xp_events;
drop policy if exists "xp events scoped read" on public.xp_events;
drop policy if exists "xp events super admin mutate" on public.xp_events;

create policy "xp events scoped read"
on public.xp_events
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_membership(auth.uid(), project_id)
  )
);

create policy "xp events super admin mutate"
on public.xp_events
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read onchain events" on public.onchain_events;
drop policy if exists "authenticated manage onchain events" on public.onchain_events;
drop policy if exists "onchain events scoped read" on public.onchain_events;
drop policy if exists "onchain events super admin mutate" on public.onchain_events;

create policy "onchain events scoped read"
on public.onchain_events
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or public.has_project_membership(auth.uid(), project_id)
);

create policy "onchain events super admin mutate"
on public.onchain_events
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read xp stakes" on public.xp_stakes;
drop policy if exists "authenticated manage xp stakes" on public.xp_stakes;
drop policy if exists "xp stakes scoped read" on public.xp_stakes;
drop policy if exists "xp stakes super admin mutate" on public.xp_stakes;

create policy "xp stakes scoped read"
on public.xp_stakes
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.campaigns c
    where c.id = xp_stakes.campaign_id
      and public.has_project_membership(auth.uid(), c.project_id)
  )
);

create policy "xp stakes super admin mutate"
on public.xp_stakes
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read reward distributions" on public.reward_distributions;
drop policy if exists "authenticated manage reward distributions" on public.reward_distributions;
drop policy if exists "reward distributions scoped read" on public.reward_distributions;
drop policy if exists "reward distributions super admin mutate" on public.reward_distributions;

create policy "reward distributions scoped read"
on public.reward_distributions
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or exists (
    select 1
    from public.campaigns c
    where c.id = reward_distributions.campaign_id
      and public.has_project_membership(auth.uid(), c.project_id)
  )
);

create policy "reward distributions super admin mutate"
on public.reward_distributions
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read trust snapshots" on public.trust_snapshots;
drop policy if exists "authenticated manage trust snapshots" on public.trust_snapshots;
drop policy if exists "trust snapshots own read" on public.trust_snapshots;
drop policy if exists "trust snapshots super admin mutate" on public.trust_snapshots;

create policy "trust snapshots own read"
on public.trust_snapshots
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
);

create policy "trust snapshots super admin mutate"
on public.trust_snapshots
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read review flags" on public.review_flags;
drop policy if exists "authenticated manage review flags" on public.review_flags;
drop policy if exists "review flags scoped read" on public.review_flags;
drop policy if exists "review flags super admin mutate" on public.review_flags;

create policy "review flags scoped read"
on public.review_flags
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_membership(auth.uid(), project_id)
  )
);

create policy "review flags super admin mutate"
on public.review_flags
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

drop policy if exists "authenticated read verification results" on public.verification_results;
drop policy if exists "authenticated insert verification results" on public.verification_results;
drop policy if exists "authenticated update verification results" on public.verification_results;
drop policy if exists "verification results scoped read" on public.verification_results;
drop policy if exists "verification results super admin mutate" on public.verification_results;

create policy "verification results scoped read"
on public.verification_results
for select
to authenticated
using (
  auth.uid() = auth_user_id
  or public.is_super_admin(auth.uid())
  or (
    project_id is not null
    and public.has_project_membership(auth.uid(), project_id)
  )
);

create policy "verification results super admin mutate"
on public.verification_results
for all
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

commit;
