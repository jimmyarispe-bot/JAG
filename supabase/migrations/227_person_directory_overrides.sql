-- 227: let a human correct a person's directory category
--
-- The People directory derives its categories from two different status
-- vocabularies — students.enrollment_status and admissions_leads.lead_stage.
-- Derivation is right most of the time and wrong at the edges, because the
-- underlying statuses were themselves set by a migration from a legacy CRM
-- whose vocabulary mixed up where a family stood with what staff owed them.
--
-- Rather than keep guessing, this records a deliberate human decision. An
-- override always wins over the derived value, and clearing it returns the
-- person to whatever the data implies.
--
-- Deliberately NOT stored on students/admissions_leads: this is an editorial
-- judgement about presentation, not a change to the record's real status. A
-- withdrawn student is still withdrawn even when filed under something else.

create table if not exists public.person_directory_overrides (
  id uuid primary key default gen_random_uuid(),
  -- Which table the person lives in. No FK: the row may move between tables
  -- when a prospect enrols, and an override should not block that.
  person_kind text not null check (person_kind in ('student', 'prospect')),
  person_id uuid not null,
  group_key text not null check (
    group_key in ('enrolled', 'pipeline', 'accepted', 'alumni', 'not_enrolled', 'other')
  ),
  note text,
  set_by uuid references auth.users(id) on delete set null,
  set_at timestamptz not null default now(),
  unique (person_kind, person_id)
);

comment on table public.person_directory_overrides is
  'Human corrections to the People directory category. One row per person; '
  'absent means use the derived category.';

create index if not exists idx_person_directory_overrides_person
  on public.person_directory_overrides (person_kind, person_id);

alter table public.person_directory_overrides enable row level security;

drop policy if exists person_directory_overrides_staff_all on public.person_directory_overrides;
create policy person_directory_overrides_staff_all
  on public.person_directory_overrides
  for all
  to authenticated
  using (true)
  with check (true);
