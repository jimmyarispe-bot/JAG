-- WHICH CAMPUS SEES WHICH PROGRAM QUESTION  --  in school names, not ids
--
-- 29 September 2026. The last read had the answer and the results grid cut it
-- off mid-UUID, which is the one part that mattered. This resolves each rule's
-- school id to the school's NAME, so every value is short enough to read.
--
-- WHAT IT ALREADY TOLD US, and what is still missing:
--
--   program          order 7    rule: neq <a school>   options: NONE (the five)
--   program_hs       order 100  rule: eq  <a school>   options: Only Virtual,
--                                                                Hybrid
--   program_virtual  order 103  rule: eq  <a school>   options: Only Virtual
--
-- All three sit in the "Program & School" section, which is always shown, so
-- each question's own rule is the only gate. `program` uses neq - it is shown
-- to every campus EXCEPT one. Which one decides everything: if it excludes
-- only the high school, then a Virtual family currently sees TWO program
-- questions, the network five and program_virtual's single option. That is a
-- different migration from the one I would otherwise write.
--
-- Run against a local Postgres 16 with the same shapes before sending.
-- One statement. Reads only.

with live as (
  select v.definition as def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
),
q as (
  select qq ->> 'key' as key, (qq ->> 'order')::int as ord, qq as question
    from live cross join lateral jsonb_array_elements(def -> 'questions') qq
   where qq ->> 'type' = 'program_selector'
),
cond as (
  select q.key, q.ord,
         coalesce(c ->> 'op','?') as op,
         c ->> 'value' as school_id,
         case when q.question -> 'visibleWhen' ? 'any' then 'ANY of' else 'ALL of' end as grp
    from q
    cross join lateral jsonb_array_elements(
      coalesce(q.question -> 'visibleWhen' -> 'all',
               q.question -> 'visibleWhen' -> 'any',
               '[]'::jsonb)) c
)
select x.question_key, x.ord as shown_order, x.fact, x.value
from (
  select c.key as question_key, c.ord, 'SHOWN WHEN (' || c.grp || ')' as fact,
         c.op || '  ' || coalesce(s.name, '?? unknown school ' || coalesce(c.school_id,'null')) as value
    from cond c left join public.schools s on s.id::text = c.school_id
  union all
  select q.key, q.ord, 'SHOWN WHEN', 'NO RULE - every campus sees it'
    from q where coalesce(jsonb_array_length(coalesce(q.question -> 'visibleWhen' -> 'all',
                                                      q.question -> 'visibleWhen' -> 'any')),0) = 0
  union all
  select q.key, q.ord, 'OPTION', coalesce(o ->> 'value','')
    from q cross join lateral jsonb_array_elements(coalesce(q.question -> 'options','[]'::jsonb)) o
  union all
  select q.key, q.ord, 'OPTION', '** NONE - inherits the network five **'
    from q where coalesce(jsonb_array_length(q.question -> 'options'),0) = 0
) x
order by x.ord, x.fact, x.value;
