-- ===========================================================================
-- CAN A PARENT READ THE TABLES THE APPLICATION WIZARD USES?
-- 14 September 2026. READ ONLY — one SELECT, writes nothing.
-- ===========================================================================
--
-- WHY THIS EXISTS. Five reads on the parent's path still swallow their errors
-- and return empty: application documents, state funding verifications, the
-- scholarship, scholarship documents, and the staff application list. They were
-- left half-fixed on 13 September for an honest reason — nobody had ever walked
-- the document-upload or scholarship screens as a parent, so which of those
-- reads a parent can even perform was unknown, and turning an unknown into a
-- crash page on an unexercised screen is a worse trade than leaving it.
--
-- This is the cheap first cut. Before spending a test family on the walk, ask
-- production which of those tables has ANY policy that admits a guardian at all.
--
-- HOW TO READ IT. For each table, every policy, and what its USING clause
-- actually rests on:
--
--   guardian   mentions is_guardian_of_lead / is_guardian_of_family, or matches
--              on a guardian email — a family has a path through this policy
--   staff      can_access_school, has_permission, has_role, school_id_for_* —
--              no path for a parent
--   open       `true`, or no qual at all
--
-- A table whose SELECT policies are ALL staff is a table a parent cannot read,
-- and no amount of walking the wizard will change that. A table with a guardian
-- policy still needs the walk, because a policy that exists can still be wrong.
--
-- WHAT THIS IS NOT. Structural evidence, not proof. It says which policies exist
-- and what they reference; it does not say what they return for a real person.
-- The whole of 13 September was a lesson in the difference — the repo said one
-- thing, the live database said another, and only running as the actual user
-- settled it. Treat a "guardian" row here as a reason to keep walking, never as
-- a reason to stop.
-- ===========================================================================

with wizard_tables(table_name, used_for) as (
  values
    ('admissions_applications',           'the application itself'),
    ('admissions_application_checklist_items', 'the checklist on the wizard'),
    ('application_documents',             'documents the family uploads'),
    ('state_funding_verifications',       'state funding checks'),
    ('scholarship_applications',          'the scholarship attached to it'),
    ('scholarship_documents',             'scholarship paperwork'),
    ('admissions_leads',                  'the enquiry behind it'),
    ('admissions_lead_guardians',         'the family on the enquiry')
),

pol as (
  select
    p.tablename,
    p.policyname,
    p.cmd,
    coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '') as expr
  from pg_policies p
  where p.schemaname = 'public'
),

classified as (
  select
    w.table_name,
    w.used_for,
    p.policyname,
    p.cmd,
    case
      when p.policyname is null then 'NO POLICY'
      when p.expr ~ 'is_guardian_of_lead|is_guardian_of_family|guardian_email|lg\.email' then 'guardian'
      when p.expr ~ '\mtrue\M' and p.expr !~ 'has_|can_|is_|school_id_for' then 'open'
      when p.expr ~ 'can_access_school|has_permission|has_role|school_id_for|is_platform_steward|can_access_student_record' then 'staff'
      when p.expr ~ 'auth\.uid\(\)' then 'own rows (auth.uid)'
      else 'other'
    end as rests_on,
    replace(left(p.expr, 160), E'\n', ' ') as qual_excerpt
  from wizard_tables w
  left join pol p on p.tablename = w.table_name
)

select
  table_name,
  used_for,
  coalesce(cmd, '-')        as command,
  coalesce(policyname, '-') as policy,
  rests_on,
  -- The answer, per table, repeated on every row so it is readable at a glance.
  case
    when bool_or(rests_on = 'guardian') filter (where cmd in ('SELECT', 'ALL'))
         over (partition by table_name)
      then 'a family has a path'
    when count(*) filter (where cmd in ('SELECT', 'ALL')) over (partition by table_name) = 0
      then 'NO SELECT POLICY AT ALL — nobody reads this'
    else 'STAFF ONLY — a parent cannot read this'
  end as verdict,
  qual_excerpt
from classified
order by
  case
    when bool_or(rests_on = 'guardian') filter (where cmd in ('SELECT', 'ALL'))
         over (partition by table_name) then 1 else 0
  end,
  table_name,
  cmd,
  policyname;
