-- 326_lead_documents_2026_09_11.sql
--
-- Let a document hang off a LEAD, not only an application.
--
-- WHY. The Florida inquiry now asks for the Step Up award screenshot before the
-- family can submit. At that moment there is no application — an application is
-- created later, after staff invite the family — and `application_documents` is
-- keyed only by `application_id`. There is nowhere to put the file.
--
-- THE TRAP THIS AVOIDS. The obvious shortcut is to keep the storage path in
-- `admissions_interest_answers` and move on. Answers are written there and only
-- two of them are ever read back — `student_greatness` and `student_challenges`,
-- carried into the application by `carry-forward.ts`. Nothing surfaces the rest
-- to anyone. A screenshot stored that way would upload successfully, report
-- success, and be seen by no human being. That is the same shape as every other
-- quiet failure in this system: it works, and it is invisible.
--
-- THE POLICY IS THE POINT. `application_documents_staff_all` resolves the
-- school through `school_id_for_admissions_application(application_id)`. With a
-- null application_id that returns null, `can_access_school(null)` is not true,
-- and the row is invisible to staff — so adding the column WITHOUT rewriting the
-- policy would produce exactly the failure described above, with extra steps.
-- The policy below resolves the school from the application when there is one
-- and from the lead when there is not.
--
-- The guardian policy is deliberately NOT extended. A family uploading during a
-- public inquiry has no account yet, and a document attached to a lead is
-- staff-facing until the application exists and the row is linked forward.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) The column, and the relaxation that makes it useful
-- ---------------------------------------------------------------------------

alter table public.application_documents
  add column if not exists lead_id uuid
    references public.admissions_leads(id) on delete cascade;

alter table public.application_documents
  alter column application_id drop not null;

-- A document belongs to something. Both set is the normal state once an
-- inquiry's upload is linked forward to the application it produced.
alter table public.application_documents
  drop constraint if exists application_documents_owner_present;

alter table public.application_documents
  add constraint application_documents_owner_present
  check (application_id is not null or lead_id is not null);

create index if not exists idx_application_documents_lead
  on public.application_documents(lead_id)
  where lead_id is not null;

comment on column public.application_documents.lead_id is
  'Set when the document arrived before an application existed — the Step Up award screenshot on the Florida inquiry form is the first case. Linked forward to application_id when the application is created; both columns are then populated.';

-- ---------------------------------------------------------------------------
-- 2) Staff can see documents that have no application yet
-- ---------------------------------------------------------------------------

drop policy if exists application_documents_staff_all on public.application_documents;

create policy application_documents_staff_all
on public.application_documents
for all
using (
  can_access_school(
    coalesce(
      public.school_id_for_admissions_application(application_id),
      (select l.school_id from public.admissions_leads l where l.id = lead_id)
    )
  )
)
with check (
  can_access_school(
    coalesce(
      public.school_id_for_admissions_application(application_id),
      (select l.school_id from public.admissions_leads l where l.id = lead_id)
    )
  )
);

-- ---------------------------------------------------------------------------
-- 3) What exists now
-- ---------------------------------------------------------------------------

select
  count(*) as documents,
  count(application_id) as with_application,
  count(lead_id) as with_lead,
  count(*) filter (where application_id is null and lead_id is not null) as lead_only
from public.application_documents;
