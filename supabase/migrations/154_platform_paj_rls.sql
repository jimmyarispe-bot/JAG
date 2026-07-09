-- =========================================
-- PAJ RUNTIME RLS (154)
-- Idempotent: safe to re-run
-- =========================================

alter table public.platform_paj_journeys enable row level security;
alter table public.platform_paj_domain_enrollments enable row level security;
alter table public.platform_paj_placements enable row level security;
alter table public.platform_paj_competency_progress enable row level security;
alter table public.platform_paj_skill_progress enable row level security;

drop policy if exists platform_paj_journeys_rw on public.platform_paj_journeys;
create policy platform_paj_journeys_rw on public.platform_paj_journeys
  for all to authenticated using (true) with check (true);

drop policy if exists platform_paj_domain_enrollments_rw on public.platform_paj_domain_enrollments;
create policy platform_paj_domain_enrollments_rw on public.platform_paj_domain_enrollments
  for all to authenticated using (true) with check (true);

drop policy if exists platform_paj_placements_rw on public.platform_paj_placements;
create policy platform_paj_placements_rw on public.platform_paj_placements
  for all to authenticated using (true) with check (true);

drop policy if exists platform_paj_competency_progress_rw on public.platform_paj_competency_progress;
create policy platform_paj_competency_progress_rw on public.platform_paj_competency_progress
  for all to authenticated using (true) with check (true);

drop policy if exists platform_paj_skill_progress_rw on public.platform_paj_skill_progress;
create policy platform_paj_skill_progress_rw on public.platform_paj_skill_progress
  for all to authenticated using (true) with check (true);

grant select, insert, update on table public.platform_paj_journeys to authenticated;
grant select, insert, update on table public.platform_paj_domain_enrollments to authenticated;
grant select, insert on table public.platform_paj_placements to authenticated;
grant select, insert, update on table public.platform_paj_competency_progress to authenticated;
grant select, insert, update on table public.platform_paj_skill_progress to authenticated;

grant all on table public.platform_paj_journeys to service_role;
grant all on table public.platform_paj_domain_enrollments to service_role;
grant all on table public.platform_paj_placements to service_role;
grant all on table public.platform_paj_competency_progress to service_role;
grant all on table public.platform_paj_skill_progress to service_role;
