/*
  DID MIGRATION 407 EVER RUN — read-only. Nothing here writes.

  WHY. A full column listing of public.students ends at `school_email` with no
  `hispanic_or_latino` and no `race`. Columns are listed in ordinal order, so
  anything added by migration 407 on 22 Sep would appear last. Their absence
  suggests 407 was written but never applied.

  407 was meant to add, on BOTH tables:
      hispanic_or_latino  boolean
      race                text[]

  WHAT EMPTY MEANS, decided before running it:

  1. the columns — zero rows means 407 never ran anywhere, and no ethnicity has
                   been recorded for any student or lead. Two rows means it ran
                   on one table only. Four means it ran fully.
  2. any answers — only meaningful if the columns exist. Zero populated with
                   the columns present means the columns are there and nothing
                   has been written to them yet, which is expected: nothing
                   copies answers from admissions_interest_answers onto a lead
                   or a student.
*/

select
  '1. the columns' as check,
  table_name || '.' || column_name as detail,
  data_type as extra
from information_schema.columns
where table_schema = 'public'
  and table_name in ('students', 'admissions_leads')
  and column_name in ('hispanic_or_latino', 'race')

union all

-- Does the interest form hold ethnicity answers waiting to be carried across?
select
  '2. any answers',
  'interest answers mentioning ethnicity or race',
  count(*)::text
from public.admissions_interest_answers
where to_jsonb(admissions_interest_answers)::text ilike '%hispanic%'
   or to_jsonb(admissions_interest_answers)::text ilike '%race%'

order by 1, 2;
