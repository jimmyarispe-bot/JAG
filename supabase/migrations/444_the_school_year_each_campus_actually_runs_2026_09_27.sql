-- 444_the_school_year_each_campus_actually_runs_2026_09_27.sql
--
-- Correct the 2026-2027 dates. Three of the four campuses are wrong, and the
-- wrongness is the invisible kind.
--
-- Jimmy, 27 September 2026:
--
--   "ga n fl - june 1 - may 31; virtual n high school aug 1 - may 31"
--
-- WHAT IS THERE NOW, and where it came from. Migration 261 created the
-- 2026-2027 years on 5 September by taking each school's 2025-2026 row and
-- adding a year. That was the right instinct - carry each campus's own dates
-- rather than guess them - but it carried forward dates that were already
-- wrong, and inherited them faithfully.
--
--   The Academy FL        2026-07-01 -> 2027-06-30     should be Jun 1 - May 31
--   The Academy GA        2026-07-01 -> 2027-06-30     should be Jun 1 - May 31
--   The Academy Virtual   2026-07-01 -> 2027-06-30     should be Aug 1 - May 31
--   The Academy HS        2026-08-15 -> 2027-06-01     should be Aug 1 - May 31
--
-- WHY IT MATTERS AND WHY NOTHING HAS COMPLAINED. These dates are the
-- denominator of every prorated tuition figure. A Virtual student starting on
-- 1 October should have 8 months left of an August-May year. Against a
-- July-June year they have 9, and the family is billed for a month the school
-- year does not contain. The arithmetic runs, the dates look plausible on
-- screen, and the error only ever shows up as a number somebody has to argue
-- about. No tuition plan has been built on these yet, which is the only reason
-- this is a correction and not a refund.
--
-- WHAT IS DELIBERATELY NOT CHANGED.
--
--   The NAMES. "2026-2027 Year-Round" stays on Virtual even though Virtual now
--   runs August to May, because Virtual and HS students may also attend in
--   June and July at a monthly rate - which is very likely what "Year-Round"
--   was describing. Renaming it would erase that meaning on a guess. Flagged
--   for Jimmy rather than decided here.
--
--   The 2025-2026 rows. They are inactive and finished. Editing history to
--   look tidy would be a lie about what those years were.
--
-- A NOTE FOR WHOEVER CREATES 2027-2028. Do not derive it from 2025-2026 the
-- way 261 did. Derive it from the corrected 2026-2027 rows below, or the same
-- wrong dates come back.
--
-- Safe to re-run.

begin;

-- `school_start_month` is updated alongside the dates. Leaving it at 7 while
-- start_date says June is two fields disagreeing about one fact, and the next
-- person to read one without the other gets the wrong answer.

update public.school_years sy
   set start_date         = v.start_date,
       end_date           = v.end_date,
       school_start_month = extract(month from v.start_date)::int,
       updated_at         = now()
  from (values
          ('The Academy FL',      date '2026-06-01', date '2027-05-31'),
          ('The Academy GA',      date '2026-06-01', date '2027-05-31'),
          ('The Academy Virtual', date '2026-08-01', date '2027-05-31'),
          ('The Academy HS',      date '2026-08-01', date '2027-05-31')
       ) as v(school_name, start_date, end_date)
  join public.schools sc on lower(trim(sc.name)) = lower(v.school_name)
 where sy.school_id = sc.id
   and sy.name like '2026-2027%'
   and (sy.start_date, sy.end_date) is distinct from (v.start_date, v.end_date);

-- Exactly one current year per school: the one today actually falls inside.
-- Recomputed because the window just moved under it.
update public.school_years
   set is_current = (current_date between start_date and end_date),
       updated_at = now();

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- 'corrected'   : four rows, each reading ok.
-- 'current'     : exactly four rows, one per school, all 2026-2027.
-- 'uncovered'   : July 2026 is no longer inside any Virtual or HS year, which
--                 is correct and intended - those months are billed monthly,
--                 not as part of the contracted year. This row exists so the
--                 gap is something you were told about rather than something
--                 you find. It is not an error.

select 'corrected'::text as finding,
       sc.name as school,
       sy.start_date::text || ' to ' || sy.end_date::text as dates,
       case
         when sc.name in ('The Academy Virtual', 'The Academy HS')
              and sy.start_date = date '2026-08-01' and sy.end_date = date '2027-05-31'
           then 'ok — Aug 1 to May 31'
         when sc.name in ('The Academy FL', 'The Academy GA')
              and sy.start_date = date '2026-06-01' and sy.end_date = date '2027-05-31'
           then 'ok — Jun 1 to May 31'
         else 'STILL WRONG'
       end as state
  from public.school_years sy
  join public.schools sc on sc.id = sy.school_id
 where sy.name like '2026-2027%'

union all

select 'current', sc.name, sy.name,
       sy.start_date::text || ' to ' || sy.end_date::text
  from public.school_years sy
  join public.schools sc on sc.id = sy.school_id
 where sy.is_current

union all

select 'uncovered', sc.name,
       'June and July 2026 sit outside the contracted year',
       'billed monthly instead — intended'
  from public.schools sc
 where sc.name in ('The Academy Virtual', 'The Academy HS')

order by 1, 2;
