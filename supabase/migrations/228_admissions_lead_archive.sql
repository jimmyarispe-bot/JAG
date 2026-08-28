-- Archive for admissions leads, matching what students already have.
--
-- Students got `previous_status` / `archived_at` / `archived_by` in migration
-- 188, so a student can be taken off a list without erasing a child's record.
-- Leads had nothing: the only way to remove one was a hard delete, which is why
-- the test rows and the duplicate entries are still sitting in the pipeline.
--
-- Deliberately NOT another lead_stage value. `lead_stage` says where a family
-- stands with us, and "archived" is not a position in the funnel -- it is a
-- statement about the record. Folding one into the other is how `withdrawn`,
-- `graduated` and `not_returning` ended up meaning three different things in
-- one column. A separate timestamp keeps the stage intact, so restoring a lead
-- puts it back exactly where it was with no lookup table of previous values.
--
-- It also leaves the lead_stage CHECK constraint (migration 225) untouched.

alter table public.admissions_leads
  add column if not exists archived_at timestamptz;

alter table public.admissions_leads
  add column if not exists archived_by uuid references public.users(id) on delete set null;

alter table public.admissions_leads
  add column if not exists archived_reason text;

comment on column public.admissions_leads.archived_at is
  'Set when the lead is archived. Null means active. The lead_stage is left alone so restoring needs no previous-value lookup.';

-- Every list filters on "not archived", so index the live rows only. A partial
-- index here is a fraction of the size of a full one and is the one the
-- planner wants.
create index if not exists idx_admissions_leads_active
  on public.admissions_leads (school_id, lead_stage)
  where archived_at is null;
