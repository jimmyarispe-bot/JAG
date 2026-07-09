-- =========================================
-- WAVE 2: ULR RLS (150)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_ulr_domains enable row level security;
alter table public.platform_ulr_strands enable row level security;
alter table public.platform_ulr_sub_strands enable row level security;
alter table public.platform_ulr_competencies enable row level security;
alter table public.platform_ulr_atomic_skills enable row level security;
alter table public.platform_ulr_relationships enable row level security;

drop policy if exists platform_ulr_domains_read on public.platform_ulr_domains;
create policy platform_ulr_domains_read on public.platform_ulr_domains
  for select to authenticated using (true);

drop policy if exists platform_ulr_strands_read on public.platform_ulr_strands;
create policy platform_ulr_strands_read on public.platform_ulr_strands
  for select to authenticated using (true);

drop policy if exists platform_ulr_sub_strands_read on public.platform_ulr_sub_strands;
create policy platform_ulr_sub_strands_read on public.platform_ulr_sub_strands
  for select to authenticated using (true);

drop policy if exists platform_ulr_competencies_read on public.platform_ulr_competencies;
create policy platform_ulr_competencies_read on public.platform_ulr_competencies
  for select to authenticated using (true);

drop policy if exists platform_ulr_competencies_write on public.platform_ulr_competencies;
create policy platform_ulr_competencies_write on public.platform_ulr_competencies
  for insert to authenticated with check (true);

drop policy if exists platform_ulr_competencies_update on public.platform_ulr_competencies;
create policy platform_ulr_competencies_update on public.platform_ulr_competencies
  for update to authenticated using (true) with check (true);

drop policy if exists platform_ulr_atomic_skills_read on public.platform_ulr_atomic_skills;
create policy platform_ulr_atomic_skills_read on public.platform_ulr_atomic_skills
  for select to authenticated using (true);

drop policy if exists platform_ulr_atomic_skills_write on public.platform_ulr_atomic_skills;
create policy platform_ulr_atomic_skills_write on public.platform_ulr_atomic_skills
  for insert to authenticated with check (true);

drop policy if exists platform_ulr_relationships_read on public.platform_ulr_relationships;
create policy platform_ulr_relationships_read on public.platform_ulr_relationships
  for select to authenticated using (true);

drop policy if exists platform_ulr_relationships_write on public.platform_ulr_relationships;
create policy platform_ulr_relationships_write on public.platform_ulr_relationships
  for insert to authenticated with check (true);

grant select on table public.platform_ulr_domains to authenticated;
grant select on table public.platform_ulr_strands to authenticated;
grant select on table public.platform_ulr_sub_strands to authenticated;
grant select, insert, update on table public.platform_ulr_competencies to authenticated;
grant select, insert on table public.platform_ulr_atomic_skills to authenticated;
grant select, insert on table public.platform_ulr_relationships to authenticated;

grant all on table public.platform_ulr_domains to service_role;
grant all on table public.platform_ulr_strands to service_role;
grant all on table public.platform_ulr_sub_strands to service_role;
grant all on table public.platform_ulr_competencies to service_role;
grant all on table public.platform_ulr_atomic_skills to service_role;
grant all on table public.platform_ulr_relationships to service_role;

notify pgrst, 'reload schema';
