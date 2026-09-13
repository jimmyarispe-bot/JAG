-- ===========================================================================
-- 351. A PROSPECTIVE PARENT CAN SEE THE CAMPUS SHE APPLIED TO
-- 13 September 2026
-- ===========================================================================
--
-- WHAT IS BROKEN. After migration 350, Lana Robinson can sign in and see
-- Savannah's enquiry in the application portal. The card shows:
--
--     Savannah Robinson
--     School · —                          <-- campus name blank
--     [ School year unavailable ]         <-- button disabled
--
-- Measured against production, 13 September, same lead, two sessions:
--
--                              as owner        as Lana
--     the campus               The Academy GA   0 rows
--     any school year          2 rows           0 rows
--     the current school year  1 row            0 rows
--     lead joined to campus    —                0 rows
--
-- The rows exist. She cannot read them.
--
-- WHY. can_access_school admits a PARENT only through an enrolled child:
--
--     or ( has_role('PARENT') and exists (
--            select 1 from student_family_link sfl
--            join students s on s.id = sfl.student_id
--            where sfl.user_id = auth.uid() and s.school_id = ... ))
--
-- Lana has no student. She has a lead. A family that has enquired but not yet
-- enrolled has no path through that function at all — which is every family at
-- the exact moment they are being asked to apply.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS DELIBERATELY DOES NOT DO.
--
-- It does not add a prospective-guardian branch to can_access_school. That
-- function gates 865 policies. Widening it would hand a prospective parent
-- every table scoped to that campus — other families' leads, other children's
-- records, finance. The grant has to be the campus she enquired at and nothing
-- else, so it is written as two narrow SELECT policies on two tables.
--
-- Both are ADDITIVE. Postgres ORs policies together, so nothing any existing
-- policy already allows or denies changes. No existing policy is dropped.
-- ---------------------------------------------------------------------------
--
-- WHAT SHE CAN SEE, COLUMN BY COLUMN. An RLS policy grants whole rows, so the
-- columns were read from production before writing this rather than assumed:
--
--   schools        name, address, timezone, organization_id, region_id,
--                  admissions_interest_public, admissions_contact_name,
--                  admissions_contact_email, admissions_booking_url,
--                  admissions_from_email, shadow_days_url, tour_booking_url,
--                  meets_virtually, created_at, updated_at
--
--   school_years   name, start_date, end_date, school_start_month,
--                  is_current, status, created_at, updated_at
--
-- All of it is what a school publishes: the campus name, where it is, who to
-- contact, how to book a tour, when the year runs. Several of these values are
-- already sent to this same family in the enquiry and invitation emails. There
-- is no bank detail, tax id, or internal note in either table.
--
-- SECURITY DEFINER on the helper, for the reason migration 350 exists: a
-- security-invoker function that reads tables from inside a policy is how the
-- entire product locked parents out. Its reads are all scoped to auth.uid(),
-- and it takes no argument that lets a caller ask about anyone else — it
-- answers one question about the person calling it. search_path is pinned,
-- because a definer function without one can be hijacked.
--
-- WHEN ACCESS ENDS. When the guardian row or the lead goes away. There is
-- deliberately no expiry: a family mid-application who could no longer see the
-- campus name would be back where this started.
-- ===========================================================================

create or replace function public.is_prospective_guardian_at_school(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admissions_lead_guardians g
    join public.admissions_leads l on l.id = g.lead_id
    join public.users u on u.id = auth.uid()
    where l.school_id = p_school_id
      and g.email is not null
      and lower(g.email) = lower(u.email)
  );
$$;

comment on function public.is_prospective_guardian_at_school(uuid) is
  'True when the calling user is a guardian on an admissions lead at this campus. '
  'Answers only about auth.uid(). Added 2026-09-13 so a family that has enquired '
  'but not yet enrolled can see the campus name and school year in the portal.';

grant execute on function public.is_prospective_guardian_at_school(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- The campus. Without this the portal renders "School · —" to a parent who is
-- being asked to apply to a school it will not name.
-- ---------------------------------------------------------------------------
drop policy if exists schools_prospective_guardian_select on public.schools;
create policy schools_prospective_guardian_select on public.schools
  for select
  to authenticated
  using (public.is_prospective_guardian_at_school(id));

-- ---------------------------------------------------------------------------
-- The school year. Start Application is disabled without one, so this is the
-- row standing between a family and the application they were invited to make.
-- ---------------------------------------------------------------------------
drop policy if exists school_years_prospective_guardian_select on public.school_years;
create policy school_years_prospective_guardian_select on public.school_years
  for select
  to authenticated
  using (public.is_prospective_guardian_at_school(school_id));

-- ---------------------------------------------------------------------------
-- Refuse to be believed.
-- ---------------------------------------------------------------------------
do $$
declare
  missing text := '';
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_prospective_guardian_at_school'
      and p.prosecdef
  ) then
    missing := missing || 'helper is not SECURITY DEFINER; ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'schools'
      and policyname = 'schools_prospective_guardian_select'
  ) then
    missing := missing || 'schools policy absent; ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'school_years'
      and policyname = 'school_years_prospective_guardian_select'
  ) then
    missing := missing || 'school_years policy absent; ';
  end if;

  if missing <> '' then
    raise exception 'Migration 351 did not take effect: %', missing;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- VERIFICATION. Re-run, as Lana:
--   supabase/diagnostics/parent_cannot_start_application_2026_09_13.sql
--
-- Section B must change from
--   2. the campus                 0 rows
--   4. the current school year    0 rows
--   5. lead joined to campus      0 rows
-- to 1 row each. Section A is unchanged — staff access is untouched.
--
-- Then confirm the grant is narrow rather than broad. As a parent, this must
-- still return only the campus she enquired at, not every school:
--   select count(*) from public.schools;
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';
