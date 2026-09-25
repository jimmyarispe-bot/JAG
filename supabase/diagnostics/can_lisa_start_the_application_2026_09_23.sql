/*
  CAN LISA START THE APPLICATION — read-only. Nothing here writes.

  WHY. Lisa Roy now has an account and can reach /apply/portal. The button that
  starts an application is drawn from getCurrentSchoolYear(school_id):

      select id, name from school_years
      where school_id = <lead's school> and is_current = true

  If that returns nothing, she does not get "Start Application". She gets
  "School year unavailable" - a dead button, on the page the invitation sent
  her to. No application has ever been started in this platform, so this has
  never been exercised for any campus.

  WHAT EMPTY MEANS, decided before running it:

  1. GA current year — ONE row is the good answer. Zero means Lisa cannot start
                       and neither can any other GA family. More than one means
                       maybeSingle() errors and she gets "Couldn't load", which
                       looks like a glitch and is actually a data fault.
  2. every campus    — the same question for all four, because Heather's 25
                       families are behind the same button.
  3. her lead        — confirms which school_id her lead actually points at.
                       A lead on a school with no year is the same dead end.
*/

-- 1 and 2. Current school year per campus.
select
  '1. current year' as check,
  s.name as detail,
  coalesce(
    (
      select string_agg(y.name, ' | ')
      from public.school_years y
      where y.school_id = s.id and y.is_current = true
    ),
    'NONE - the Start Application button will be dead for this campus'
  )
    || '  (' || (
      select count(*)::text
      from public.school_years y
      where y.school_id = s.id and y.is_current = true
    ) || ' marked current, '
    || (select count(*)::text from public.school_years y where y.school_id = s.id)
    || ' total)' as extra
from public.schools s

union all

-- 3. Which campus Lisa's lead actually points at.
select
  '2. her lead',
  coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, ''),
  'school=' || coalesce(sc.name, 'NO SCHOOL')
    || ' | lead_stage=' || coalesce(l.lead_stage, 'NULL')
from public.admissions_leads l
left join public.schools sc on sc.id = l.school_id
where l.id = '66f94d1c-37d9-4ae3-88a4-b1168636e8a2'

order by 1, 2;
