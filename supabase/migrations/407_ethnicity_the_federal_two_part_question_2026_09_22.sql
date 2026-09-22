-- ===========================================================================
-- ETHNICITY - THE FEDERAL TWO-PART QUESTION  -  407  -  2026-09-22
--
-- Jimmy, 22 September: add ethnicity to all applications.
--
-- NOTHING IN JAG RECORDED IT. No column named ethnicity, race or hispanic
-- exists anywhere in 406 migrations. Not on students, not on leads, not on
-- applications.
--
-- WHY TWO COLUMNS AND NOT ONE. The federal standard used by Florida and
-- Georgia for state reporting asks TWO questions, in this order:
--
--   1. Is the student Hispanic or Latino?          yes / no
--   2. Select one or more races.                   five categories
--
-- Ethnicity and race are separate questions and the second is multi-select. A
-- single "Ethnicity" dropdown cannot express a child who is more than one
-- race, and cannot be mapped to a state return or a funder's question without
-- going back to every family and asking again. Asking once, in the shape the
-- reports need, is the whole point.
--
-- PLAIN COLUMNS, NO FOREIGN KEYS. A boolean and a text[]. Deliberately not a
-- lookup table: migration 406 added a second foreign key from
-- instructional_sessions to employees a few hours ago and PostgREST refused
-- every embed of that table until the query named which relationship it meant.
-- Every teacher's timesheet went down. A reference table here would put the
-- same trap on students, which far more of the application embeds.
--
-- BLANK MEANS NOT ANSWERED, AND STAYS BLANK. No default, no 'unknown'
-- sentinel, no backfill. 82 active students have never been asked this
-- question, and writing a value into their rows would assert something nobody
-- told us. A family may also decline, and declining looks the same as not yet
-- asked - which is correct, because neither is an answer.
--
-- ON LEADS AND ON STUDENTS BOTH. The answer arrives on an application, which
-- lands as a lead, and has to survive the crossing into the roster. Recorded
-- in both places so conversion carries it rather than dropping it.
-- ===========================================================================

begin;

do $$
declare
  v_table text;
begin
  foreach v_table in array array['students', 'admissions_leads']
  loop
    if to_regclass('public.' || v_table) is null then
      raise notice 'No table public.% - skipped.', v_table;
      continue;
    end if;

    execute format(
      'alter table public.%I add column if not exists hispanic_or_latino boolean',
      v_table
    );

    execute format(
      'alter table public.%I add column if not exists race text[]',
      v_table
    );

    -- Every element must be one of the five federal categories. An array that
    -- is null or empty is fine: that is "not answered".
    execute format(
      'alter table public.%I drop constraint if exists %I',
      v_table, v_table || '_race_valid'
    );

    execute format(
      'alter table public.%I add constraint %I check ('
      || ' race is null or race <@ array['
      || '''american_indian_or_alaska_native'','
      || '''asian'','
      || '''black_or_african_american'','
      || '''native_hawaiian_or_other_pacific_islander'','
      || '''white'']::text[] )',
      v_table, v_table || '_race_valid'
    );

    raise notice 'ethnicity columns ready on public.%', v_table;
  end loop;
end $$;

comment on column public.students.hispanic_or_latino is
  'Federal question 1: is the student Hispanic or Latino. NULL means not '
  'answered - which is also what declining looks like, correctly, because '
  'neither is an answer.';

comment on column public.students.race is
  'Federal question 2: one or more of american_indian_or_alaska_native, asian, '
  'black_or_african_american, native_hawaiian_or_other_pacific_islander, white. '
  'Multi-select because a child may be more than one. NULL or empty means not '
  'answered.';

commit;

-- ===========================================================================
-- VERIFY.
-- ===========================================================================

-- 1. The columns, on both tables. EXPECT FOUR ROWS.
select
  '1. columns'                                      as check,
  table_name || '.' || column_name                  as detail,
  data_type                                         as extra
from information_schema.columns
where table_schema = 'public'
  and table_name in ('students', 'admissions_leads')
  and column_name in ('hispanic_or_latino', 'race')

union all

-- 2. The constraints. EXPECT TWO ROWS.
select
  '2. race constraint',
  conrelid::regclass::text,
  conname
from pg_constraint
where conname like '%\_race\_valid'

union all

-- 3. How many have an answer. EXPECT ZERO on both - nothing here backfills,
--    and no family has been asked yet.
select
  '3. answered so far',
  'students with any answer',
  count(*)::text
from public.students
where hispanic_or_latino is not null
   or (race is not null and cardinality(race) > 0)

order by 1, 2;
