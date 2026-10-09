-- ==========================================================================
-- 518 — A TEACHER CAN SAY SHE MISSED A CLASS
--
-- 8 October 2026. Run top to bottom. The last statement verifies.
--
-- ── WHY ───────────────────────────────────────────────────────────────────
--
-- Jimmy, 8 October 2026, paysheet change 3 of 6:
--
--     "teachers need to identify/select which classes they missed each day"
--
-- A teacher's week is built from what she ADDS. If she did not teach a class
-- she simply never adds it, so the JAG holds no record that it was supposed
-- to happen and did not. A missed class and a class nobody ever scheduled
-- look identical, which means:
--
--   - nobody can see a gap in cover without asking her
--   - a colleague who stood in has nothing to point at
--   - the week reads as complete when it is not
--
-- An absence recorded is an absence somebody can act on. An absence that is
-- just a missing row is one nobody will ever find.
--
-- ── WHAT THIS ADDS ────────────────────────────────────────────────────────
--
--   teacher_class_entries.missed       boolean, default false
--   teacher_class_entries.missed_note  text, nullable
--
-- A missed entry is still a row on her week, at its real day and hour, so it
-- is visible. It pays nothing.
--
-- ── WHY A FLAG AND NOT A DELETE ───────────────────────────────────────────
--
-- Deleting the entry is what happens today, and it is exactly the behaviour
-- being fixed. The row IS the record.
--
-- ── WHY NOT instructional_sessions.session_status ─────────────────────────
--
-- setClassHeldAction already writes 'cancelled' there, and that is a
-- different thing: it is the SCHOOL'S record of whether a session happened,
-- on a table the teacher's own week does not read. The week screen is built
-- from teacher_class_entries. Marking one and reading the other is how two
-- systems come to disagree about the same morning — the lesson from Danni's
-- two addresses and Cassandra's two spellings, both found today.
--
-- Idempotent. Safe to re-run.
-- ==========================================================================

begin;

alter table public.teacher_class_entries
  add column if not exists missed boolean not null default false;

alter table public.teacher_class_entries
  add column if not exists missed_note text;

comment on column public.teacher_class_entries.missed is
  'She was down to teach this and did not. The row stays on her week at its '
  'real day and hour so the gap is visible, and it pays nothing. Set from '
  'the teacher week screen; never inferred.';

comment on column public.teacher_class_entries.missed_note is
  'Why, in her words. Optional, and deliberately not a list of reasons to '
  'choose from - the useful ones are never on the list.';

-- A missed class is rare. Index only those rows: the partial index is a
-- fraction of the size and is the one the planner wants for "what was
-- missed this week".
create index if not exists idx_teacher_class_entries_missed
  on public.teacher_class_entries (teacher_week_id)
  where missed;

-- ASSERT, THEN COMMIT -------------------------------------------------------
do $$
declare
  cols int;
begin
  select count(*) into cols
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'teacher_class_entries'
    and column_name in ('missed', 'missed_note');

  if cols <> 2 then
    raise exception '518: expected both columns on teacher_class_entries, found %', cols;
  end if;
end $$;

commit;

-- ── SEE IT DONE ──────────────────────────────────────────────────────────
-- Both columns present, and nothing marked missed yet.
select
  c.column_name                                           as column_name,
  c.data_type                                             as data_type,
  coalesce(c.column_default, '(none)')                    as default_value,
  c.is_nullable                                           as nullable,
  (select count(*) from public.teacher_class_entries e where e.missed)::text
                                                          as rows_marked_missed
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'teacher_class_entries'
  and c.column_name in ('missed', 'missed_note')
order by c.column_name;
