-- DID 451 ACTUALLY LAND?  --  six checks, one grid, PASS or FAIL
--
-- 29 September 2026. 451 ran without error, but the Supabase editor shows only
-- the LAST statement of a script - and its help-text row truncated at exactly
-- the point where the appended sentence would appear. So the migration said
-- nothing visible about whether it worked.
--
-- This asks the six questions that matter and answers each PASS or FAIL, with
-- values short enough that nothing can be cut off.
--
-- Run against a local Postgres 16 with the same shapes before being sent.
-- Reads only.

with live as (
  select v.version_number, v.definition as def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
),
opts as (
  select q ->> 'key' as k, count(o.*) as n
    from live cross join lateral jsonb_array_elements(def -> 'questions') q
    left join lateral jsonb_array_elements(coalesce(q -> 'options','[]'::jsonb)) o on true
   where q ->> 'type' = 'program_selector'
   group by q ->> 'key'
),
help as (
  select coalesce(q ->> 'helpText','') as t
    from live cross join lateral jsonb_array_elements(def -> 'questions') q
   where q ->> 'key' = 'hs_student_email'
)
select x.check, x.expected, x.actual,
       case when x.actual like x.expected || '%' then 'PASS' else '** FAIL **' end as verdict
from (
  select 1 as ord, 'a version is published' as check, 'yes' as expected,
         case when version_number is not null
              then 'yes (v' || version_number::text || ')' else 'no' end as actual
    from live
  union all
  select 2, 'program options (FL, GA)', '3',
         coalesce((select n::text from opts where k = 'program'), 'question missing')
  union all
  select 3, 'program_hs options', '6',
         coalesce((select n::text from opts where k = 'program_hs'), 'question missing')
  union all
  select 4, 'program_virtual options', '2',
         coalesce((select n::text from opts where k = 'program_virtual'), 'question missing')
  union all
  select 5, 'help text ends with the new line', 'yes',
         case when (select t from help)
                   like '%You will be copied into the email we send your student.'
              then 'yes' else 'no' end
  union all
  select 6, 'said once, not twice', '1',
         (select ((length(t) - length(replace(t, 'You will be copied', ''))) / 18)::text
            from help)
) x
order by x.ord;
