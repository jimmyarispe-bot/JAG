-- ===========================================================================
-- EVERY NETWORK-WIDE TEMPLATE COULD BE SEEDED TWICE, AND SOME WERE
-- 15 September 2026
-- ===========================================================================
--
-- Found while verifying migration 366. application_declined_email — the decline
-- letter Jimmy wrote — came back TWICE. Both rows school_id NULL, both active,
-- identical bodies.
--
-- WHY on conflict DID NOT PREVENT IT
--
-- Migration 247 and its neighbours all end with:
--
--     on conflict (school_id, template_key) do update set ...
--
-- which is correct for a school-specific template and does nothing at all for a
-- network-wide one. In SQL, NULL = NULL is not true, it is NULL. A unique
-- index over (school_id, template_key) therefore permits unlimited rows whose
-- school_id is NULL and whose template_key is identical. The conflict clause
-- never fires, so every re-run INSERTS rather than updates.
--
-- The seed migrations were written to be re-runnable. For network-wide rows,
-- re-running them silently multiplied them.
--
-- WHAT THE FAMILY EXPERIENCES
--
-- The delivery path resolves templates by trigger_event. Two matching rows are
-- two sends. A family declined after a full application receives the hardest
-- email in the process twice.
--
-- WHAT THIS DOES, AND WHAT IT REFUSES TO DO
--
-- Deletes EXACT duplicates only — same template_key, same subject, same body,
-- same trigger_event, same school_id — keeping the oldest row so any row
-- referenced elsewhere by created_at ordering stays put.
--
-- Where two rows share a key but DIFFER in subject or body, it deletes nothing
-- and reports them in section 3. That is not a duplicate, it is an edit that
-- landed on one copy, and choosing between two versions of a letter to a family
-- is not a migration's decision.
--
-- THEN IT CLOSES THE DOOR
--
-- A partial unique index on template_key WHERE school_id is null. That is the
-- constraint the original was trying to be, and it makes the existing
-- `on conflict` clauses start working for network-wide rows instead of
-- silently inserting.
--
-- Idempotent. Safe to re-run — which, given the subject, matters.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Exact duplicates, oldest kept.
-- ---------------------------------------------------------------------------
with ranked as (
  select id,
         row_number() over (
           partition by school_id, template_key, trigger_event, subject, body
           order by created_at, id
         ) as copy_number
  from public.admissions_communication_templates
)
delete from public.admissions_communication_templates t
using ranked r
where t.id = r.id
  and r.copy_number > 1;

commit;

-- ---------------------------------------------------------------------------
-- 2. The constraint that should always have been here.
--
-- Built outside the transaction above so a pre-existing conflict fails loudly
-- on its own rather than silently rolling back the delete with it.
-- ---------------------------------------------------------------------------
create unique index if not exists admissions_templates_one_network_wide_per_key
  on public.admissions_communication_templates (template_key)
  where school_id is null;

comment on index public.admissions_templates_one_network_wide_per_key is
  'NULL = NULL is not true, so the (school_id, template_key) unique index never '
  'constrained network-wide rows and every re-run of a seed migration inserted '
  'another copy. This is the constraint those `on conflict` clauses assumed they '
  'had. Added 15 Sep 2026 after the decline letter was found seeded twice.';

-- ===========================================================================
-- VERIFY
-- ===========================================================================

-- 1. Any key still appearing more than once network-wide. EXPECT NOTHING.
select '1. STILL DUPLICATED' as check, template_key as detail, count(*)::text as extra
from public.admissions_communication_templates
where school_id is null
group by template_key
having count(*) > 1

union all

-- 2. The index is real, not merely requested.
select '2. index', indexname, 'present'
from pg_indexes
where schemaname = 'public'
  and indexname = 'admissions_templates_one_network_wide_per_key'

union all

-- 3. SAME KEY, DIFFERENT WORDING. Nothing was deleted for these — two versions
--    of a letter exist and a person has to choose. EXPECT NOTHING, but read it
--    carefully if it is not empty.
select '3. DIFFERING COPIES',
       template_key,
       count(distinct body)::text || ' different bodies across '
         || count(*)::text || ' rows'
from public.admissions_communication_templates
group by school_id, template_key
having count(*) > 1

union all

-- 4. The decline letter specifically, since that is what exposed this.
select '4. decline letter',
       coalesce(s.name, '(network-wide)'),
       t.template_key || ' / ' || t.trigger_event
from public.admissions_communication_templates t
left join public.schools s on s.id = t.school_id
where t.template_key = 'application_declined_email'

union all

-- 5. Total live templates, for a before-and-after against your own memory.
select '5. total', 'active templates', count(*)::text
from public.admissions_communication_templates

order by 1, 2;
