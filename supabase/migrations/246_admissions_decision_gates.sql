-- 246_admissions_decision_gates.sql  (replaces the withdrawn 246_admissions_decisions.sql)
--
-- WITHDRAWN PREDECESSOR: my first 246 created a table called
-- `admissions_decisions`. That table already exists — migration 066 created it,
-- and `submitAdmissionsDecision` writes accept / waitlist / deny / request_info
-- rows to it today. `create table if not exists` would have silently done
-- nothing, and the next statement would then have failed building an index on a
-- `gate_key` column that does not exist there. If you ran it, it errored and
-- rolled back. Do not run it. This file replaces it.
--
-- The collision was also a design signal. Two different things were fighting for
-- one name:
--
--   admissions_decisions      the OUTCOME, already built — what was decided,
--                             the email that went out, which application it
--                             belonged to
--   admissions_decision_gates the QUESTION — that JAG is waiting on a named
--                             person, since when, and what happens on each answer
--
-- They are not the same record and should not share a table. A gate, once
-- answered at the accept/deny point, drives the existing decision path rather
-- than reimplementing it.
--
-- ---------------------------------------------------------------------------
--
-- The decision gate: JAG asks a school leader a question, waits, records the
-- answer, and branches. Three points in the admissions process need exactly
-- this — invite to apply, invite to shadow days, accept or deny — and building
-- it once is the difference between one mechanism and three that drift apart.
--
-- The notification email carries NO yes/no links. A forwarded email would
-- otherwise let anyone decide a child's admission, and there would be no honest
-- answer to "who decided this?". The email says a decision is waiting and links
-- into JAG, where the answer is attributable to a signed-in person.

-- shadow_day_scheduled already exists (225). The completed state does not, and
-- the accept/deny gate opens on it.
alter table public.admissions_leads
  drop constraint if exists admissions_leads_lead_stage_check;

alter table public.admissions_leads
  add constraint admissions_leads_lead_stage_check
  check (
    lead_stage in (
      'new_inquiry',
      'information_sent',
      'tour_scheduled',
      'tour_completed',
      'application_started',
      'application_submitted',
      'records_requested',
      'admissions_review',
      'accepted',
      'waitlisted',
      'declined',
      'enrolled',
      'interview_scheduled',
      'interest_meeting_held',
      'tour_requested',
      'shadow_day_scheduled',
      'shadow_day_completed',   -- new: the accept/deny gate opens here
      'assessment_scheduled',
      'not_returning'
    )
  );

create table if not exists public.admissions_decision_gates (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references public.admissions_leads(id) on delete cascade,

  /**
   * Which gate this is. Text with a CHECK rather than an enum, so adding a
   * fourth gate is a migration rather than a type rebuild across the codebase.
   */
  gate_key          text not null check (gate_key in (
                      'invite_to_apply',
                      'invite_to_shadow_days',
                      'accept_or_deny'
                    )),

  status            text not null default 'pending'
                    check (status in ('pending', 'answered', 'withdrawn')),

  /** 'yes' / 'no' for the first two gates; 'accept' / 'deny' for the third. */
  answer            text check (answer in ('yes', 'no', 'accept', 'deny')),

  /**
   * Who answered. A decision about a child's admission with no name attached is
   * not a record, it is a rumour. Enforced by the CHECK below, and
   * ON DELETE RESTRICT so removing a user cannot orphan the attribution.
   */
  answered_by       uuid references public.users(id) on delete restrict,
  answered_at       timestamptz,
  answer_notes      text,

  /**
   * Set for the accept_or_deny gate once it has driven the existing decision
   * path, so the outcome row and the question that produced it can be joined.
   */
  decision_id       uuid references public.admissions_decisions(id) on delete set null,

  /** When the "a decision is waiting" email last went out, and how many times. */
  notified_at       timestamptz,
  notify_count      integer not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint admissions_decision_gates_answer_complete check (
    (status = 'pending' and answer is null and answered_by is null and answered_at is null)
    or (status = 'answered' and answer is not null and answered_by is not null and answered_at is not null)
    or (status = 'withdrawn')
  )
);

/**
 * One open gate of a given kind per lead.
 *
 * Without this, a retried notification or a double-click creates a second
 * pending gate, and the same family can be both invited and declined depending
 * on which row someone answers.
 */
create unique index if not exists admissions_decision_gates_one_open
  on public.admissions_decision_gates (lead_id, gate_key)
  where status = 'pending';

create index if not exists admissions_decision_gates_pending_idx
  on public.admissions_decision_gates (status, created_at desc)
  where status = 'pending';

create index if not exists admissions_decision_gates_lead_idx
  on public.admissions_decision_gates (lead_id, created_at desc);

create or replace function public.touch_admissions_decision_gates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists admissions_decision_gates_touch on public.admissions_decision_gates;
create trigger admissions_decision_gates_touch
  before update on public.admissions_decision_gates
  for each row execute function public.touch_admissions_decision_gates_updated_at();

-- ------------------------------------------------------------------ RLS ----
--
-- Seeing that a decision is waiting is admissions.view. Answering one is
-- admissions.accept — the permission that already gates acceptance elsewhere —
-- because that is what these gates decide.

alter table public.admissions_decision_gates enable row level security;

drop policy if exists admissions_decision_gates_select on public.admissions_decision_gates;
create policy admissions_decision_gates_select on public.admissions_decision_gates
  for select using (public.has_permission('admissions.view'));

drop policy if exists admissions_decision_gates_insert on public.admissions_decision_gates;
create policy admissions_decision_gates_insert on public.admissions_decision_gates
  for insert with check (public.has_permission('admissions.manage'));

-- Both USING and WITH CHECK. An UPDATE policy with only one of them matches zero
-- rows and reports success, which is how `schools` silently discarded every edit
-- for months before migration 235.
drop policy if exists admissions_decision_gates_update on public.admissions_decision_gates;
create policy admissions_decision_gates_update on public.admissions_decision_gates
  for update
  using (public.has_permission('admissions.accept'))
  with check (public.has_permission('admissions.accept'));

-- No delete policy. A decision about a child is history; withdrawing a gate sets
-- status = 'withdrawn' and keeps the trail.

notify pgrst, 'reload schema';
