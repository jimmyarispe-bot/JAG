-- ============================================================================
-- 563  WHAT AN ABSENCE DID
--      16 October 2026
-- ============================================================================
--
-- The record of every letter the platform sent because a school leader was
-- marked out of office, and the thing that stops it sending twice.
--
-- ── WHY A TABLE AND NOT A COLUMN ───────────────────────────────────────────
--
-- Jimmy: "one rung per child per absence" - "correct". An absence has an
-- identity, then: the leader's calendar, plus the first working day of the
-- run. Monday to Friday is ONE absence, so Tuesday's attempt must collide
-- with Monday's row rather than send a second letter.
--
-- A boolean on admissions_leads could not express that. It would say "this
-- child was moved by an absence once, ever", and the next absence in March
-- would find it set and do nothing.
--
-- ── WHY THE UNIQUE INDEX IS THE MECHANISM, NOT A CHECK IN THE CODE ─────────
--
-- The code writes this row BEFORE it sends, and treats 23505 as "already
-- done". A select-then-insert would leave the window between the two open,
-- and two overlapping runs of the 11pm scan would both find nothing and both
-- send. The index closes it in the database, where it cannot be raced.
--
-- ── WHAT THIS DELIBERATELY DOES NOT DO ─────────────────────────────────────
--
-- It does not record skipped stages, and nothing in this feature writes to
-- `skipped_stages`. Jimmy, 16 October: "i didn't say nothing moves, i said
-- the skip to next step needs a human." A row here means one family was sent
-- the letter they were always going to be sent, a few days earlier than a
-- leader on holiday could have sent it. It never means a stage was passed
-- over.
--
-- ============================================================================

begin;

create table if not exists public.admissions_out_of_office_sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.admissions_leads(id) on delete cascade,
  /** The leader's calendar id - her booking-contact address, lower-cased. */
  calendar_id text not null,
  /** Eastern date key of the FIRST working day of the absence. Its identity. */
  absence_started_on text not null,
  /** Eastern date key this actually fired. Differs when she is out several days. */
  sent_on text not null,
  template_key text not null,
  created_at timestamptz not null default now(),
  constraint admissions_ooo_one_per_child_per_absence
    unique (lead_id, calendar_id, absence_started_on)
);

comment on table public.admissions_out_of_office_sends is
  'One row per letter sent because a school leader was marked out of office. The unique constraint is what makes a five-day absence act once per child rather than five times.';

create index if not exists idx_admissions_ooo_sends_calendar_absence
  on public.admissions_out_of_office_sends (calendar_id, absence_started_on);

create index if not exists idx_admissions_ooo_sends_sent_on
  on public.admissions_out_of_office_sends (sent_on);

-- RLS on, no policy. The only writer is the nightly scan on the service role,
-- which bypasses RLS; a signed-in client gets nothing, which is the correct
-- answer until somebody asks to see this on a screen. Enabling it now rather
-- than later means the table is never briefly world-readable.
alter table public.admissions_out_of_office_sends enable row level security;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'admissions_out_of_office_sends';

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.admissions_out_of_office_sends'::regclass
order by conname;
