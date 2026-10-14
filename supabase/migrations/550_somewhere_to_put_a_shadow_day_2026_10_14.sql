-- ============================================================================
-- 550  SOMEWHERE TO PUT A SHADOW DAY
--      14 October 2026
-- ============================================================================
--
-- WHY
--
-- The booking scan has recognised a shadow day by its title since 11 October -
-- Shadow is one of the four words a school leader titles an appointment with -
-- and has recorded exactly nothing, because there is nowhere to put it. The
-- branch pushes the child's name onto `recognisedNotRecorded`, names it in the
-- run report, and continues.
--
-- That was the right call at the time and the comment says why: on 10 October
-- a shadow day went into BOTH admissions_tours and the interviews table, which
-- is two wrong answers rather than none. So it was switched to recording
-- nothing until a real home existed. This is the home.
--
-- Jimmy tested it last night - application submitted, shadow days invited,
-- booked for 1:30am - and no decision reached him, because nothing recorded
-- the booking and nothing therefore wrote shadow_day_completed, which is the
-- stage the accept_or_deny gate opens behind.
--
-- ── THE SHAPE IS admissions_tours' SHAPE ───────────────────────────────────
--
-- Deliberately, column for column, because a shadow day is the same kind of
-- fact as a tour: a booking read off a calendar, with a status a human moves.
-- A reader who knows one table knows this one. The differences are the two
-- things a shadow day has and a tour does not:
--
--   ends_at     WHEN THE LETTER IS DUE. Jimmy, 14 October: "receipt/delivery
--               of the shadow day letter doesn't need to fire until the end of
--               the calendar appt time/day. not the beginning like with the
--               others". Every other notes letter in this platform is timed to
--               an appointment's START. This one is timed to its END, so the
--               end has to be a fact on the row rather than something
--               recomputed from a duration every time it is needed.
--
--               CalendarBooking.endsAt has been read since 4 October and the
--               comment there says why it was captured: "ten minutes after it
--               STARTS lands in the middle of it". Same lesson, one step on.
--
--   day_count   TWO AT GA AND FL, ONE AT HS AND VIRTUAL. Jimmy, 14 October:
--               "2 days @ ga n fl, 1 day @ hs n virtual". Recorded per booking
--               rather than inferred from the campus, because the campus can
--               change its mind and a row written last month should still say
--               what actually happened.
--
-- ── WHAT THIS FILE DOES NOT DO ─────────────────────────────────────────────
--
-- NO LETTER. The notes letter's words are not settled: firing at the END of
-- the appointment makes the drafted first line - "Shadow Days start right
-- now" - false, and that line is Jimmy's to write, not mine. The trigger
-- event will ship inert, exactly as staff_tour_held did, and the letter is a
-- later migration once he has given the words.
--
-- NO BACKFILL. Eight children sit at Shadow Day Scheduled from before any of
-- this existed, and their bookings were never recorded. They stay held, as
-- they have been since 13 October. Writing rows for them now would invent
-- eight appointments nobody can vouch for.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  already integer;
begin
  select count(*) into already
  from information_schema.tables
  where table_schema = 'public' and table_name = 'admissions_shadow_days';

  if already <> 0 then
    raise exception 'Refusing: admissions_shadow_days already exists.';
  end if;
end $$;

-- ── THE TABLE ──────────────────────────────────────────────────────────────

create table public.admissions_shadow_days (
  id uuid primary key default gen_random_uuid(),

  lead_id uuid not null
    references public.admissions_leads(id) on delete cascade,

  /* When Google says it starts, and when Google says it ends. Both stored:
     the first is the fact, the second is when the letter is due. */
  scheduled_at timestamptz not null,
  ends_at timestamptz,

  duration_minutes smallint not null default 360,

  /* 2 at GA and FL, 1 at HS and Virtual. Checked, not assumed - a third value
     would mean somebody has changed how this works and not said so. */
  day_count smallint not null default 1,

  /* in_person at GA, FL and HS; online at Virtual, where a shadow day is not
     at a school at all. Same vocabulary as admissions_tours.tour_type. */
  shadow_day_type text not null default 'in_person',

  /* scheduled -> completed, or cancelled. A BOOKING IS A FACT. HOLDING IT IS
     A JUDGEMENT: the scan writes 'scheduled', and only a school leader saving
     her notes writes 'completed'. */
  shadow_day_status text not null default 'scheduled',

  campus_id uuid,
  host_user_id uuid,
  notes text,
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admissions_shadow_days_status_check
    check (shadow_day_status in ('scheduled', 'completed', 'cancelled')),
  constraint admissions_shadow_days_type_check
    check (shadow_day_type in ('in_person', 'online')),
  constraint admissions_shadow_days_day_count_check
    check (day_count between 1 and 2),
  /* An appointment that ends before it starts is a reading error, not a
     booking. Refuse it at the column rather than find it in a letter. */
  constraint admissions_shadow_days_ends_after_start
    check (ends_at is null or ends_at >= scheduled_at)
);

/* ONE ROW PER CHILD PER START TIME.
   The scan is idempotent by design - it re-reads the same calendar every two
   minutes - and the tours table learned this the hard way: the same event
   visible on two shared calendars produced two rows. This index is what makes
   a second read a conflict rather than a duplicate. */
create unique index admissions_shadow_days_lead_start_unique
  on public.admissions_shadow_days (lead_id, scheduled_at);

/* The two reads this table will actually serve: a child's shadow days, and
   the scan asking what it has already recorded. */
create index idx_admissions_shadow_days_lead
  on public.admissions_shadow_days (lead_id);
create index idx_admissions_shadow_days_scheduled
  on public.admissions_shadow_days (scheduled_at);

-- ── ROW LEVEL SECURITY, THE SAME AS THE TOURS TABLE ────────────────────────
--
-- Enabled with no permissive policy for anon or authenticated. Every reader
-- and writer of this table is server-side on the service role: the booking
-- scan, the post-call page's save, and the dashboard's own queries. A family
-- never touches it. If a client ever needs to read it, that is a policy
-- written then, for that reader, rather than a door left open now.

alter table public.admissions_shadow_days enable row level security;

comment on table public.admissions_shadow_days is
  'Shadow day bookings read off the shared Google calendars. Mirrors '
  'admissions_tours. ends_at exists because the notes letter is due at the '
  'END of the appointment, not its start - see migration 550.';

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- The table, column for column beside the tours table it mirrors.
select c.column_name, c.data_type, c.is_nullable, c.column_default
from information_schema.columns c
where c.table_schema = 'public' and c.table_name = 'admissions_shadow_days'
order by c.ordinal_position;

-- Its constraints, read back.
select con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class cl on cl.oid = con.conrelid
join pg_namespace n on n.oid = cl.relnamespace
where n.nspname = 'public' and cl.relname = 'admissions_shadow_days'
order by con.contype, con.conname;

-- And its indexes.
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'admissions_shadow_days'
order by indexname;

-- Empty, and it should be. Nothing is backfilled.
select count(*) as rows_in_the_new_table from public.admissions_shadow_days;

-- The eight children still waiting, untouched and still held.
select coalesce(l.preferred_name, l.first_name) || ' ' || coalesce(l.last_name,'') as student,
       s.name as campus,
       l.lead_stage
from public.admissions_leads l
join public.schools s on s.id = l.school_id
where l.lead_stage = 'shadow_day_scheduled'
order by s.name, student;
