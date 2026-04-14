begin;

alter table public.reward_claims
  add column if not exists username text,
  add column if not exists reward_title text,
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists project_name text,
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null,
  add column if not exists campaign_title text,
  add column if not exists claim_method text default 'manual_fulfillment',
  add column if not exists reviewed_by_auth_user_id uuid;

create index if not exists idx_reward_claims_project_id
  on public.reward_claims (project_id);

create index if not exists idx_reward_claims_campaign_id
  on public.reward_claims (campaign_id);

update public.reward_claims rc
set
  username = coalesce(rc.username, up.username),
  reward_title = coalesce(rc.reward_title, r.title),
  project_id = coalesce(rc.project_id, r.project_id),
  project_name = coalesce(rc.project_name, p.name),
  campaign_id = coalesce(rc.campaign_id, r.campaign_id),
  campaign_title = coalesce(rc.campaign_title, c.title),
  claim_method = coalesce(rc.claim_method, r.claim_method, 'manual_fulfillment')
from public.rewards r
left join public.projects p on p.id = coalesce(rc.project_id, r.project_id)
left join public.campaigns c on c.id = coalesce(rc.campaign_id, r.campaign_id)
left join public.user_profiles up on up.auth_user_id = rc.auth_user_id
where rc.reward_id = r.id::text;

commit;
