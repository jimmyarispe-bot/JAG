-- WHAT THE LIVE INTEREST FORM ACTUALLY OFFERS  --  ONE QUERY, ONE GRID
--
-- 28 September 2026. Everything the migration needs, in a single result set.
--
-- WHY ONE STATEMENT. The first version of this file asked four questions in
-- four statements, and Supabase's editor shows only the LAST statement's
-- result. Three answers were computed and thrown away, and the screen said
-- "0 rows" - which read like the data was missing rather than the output.
-- Four separate runs would also work; one query cannot be half-read.
--
-- Run against a local Postgres 16 with the same table shapes before being
-- sent, after an earlier version of this file guessed three column names and
-- failed on all three. Column names come from the select statements in
-- src/lib/admissions/interest-form/load.ts.
--
-- THE LIVE VERSION IS THE ONE THE FORM POINTS AT - forms.published_version_id
-- - not "any version whose lifecycle is published". A form with two published
-- versions would otherwise report the wrong one and the migration would edit
-- a version nobody is being served.
--
-- Reads only. Nothing here writes.
--
-- WHAT TO LOOK FOR
--   A. one row. live_version_id saying NONE means the public form serves
--      nothing to anybody, which is a bigger problem than this request.
--   B. one row per program option, with the rule each carries today.
--      "QUESTION HAS NO OPTIONS" means the question inherits the network
--      default and the migration must write the whole list, not edit it.
--   C. the student email question - its key, and the help text Jimmy's line
--      gets appended to.
--   D. the four school ids the visibility rules are keyed on.

select x.section, x.item, x.detail_a, x.detail_b
from (
  select 1 as ord, 'A. LIVE FORM' as section,
         coalesce(f.title,'(no title)') as item,
         'live_version_id=' || coalesce(v.id::text,'** NONE - the public form serves nothing **') as detail_a,
         'version ' || coalesce(v.version_number::text,'?') || ', lifecycle ' || coalesce(v.lifecycle,'?') as detail_b
    from public.admissions_interest_forms f
    left join public.admissions_interest_form_versions v on v.id = f.published_version_id

  union all

  select 2, 'B. PROGRAM OPTION',
         coalesce(o ->> 'value','** QUESTION HAS NO OPTIONS **'),
         'rule_today=' || coalesce((o -> 'visibleWhen')::text,'none'),
         'question_key=' || (q ->> 'key')
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
    cross join lateral jsonb_array_elements(v.definition -> 'questions') q
    left join lateral jsonb_array_elements(coalesce(q -> 'options','[]'::jsonb)) o on true
   where q ->> 'type' = 'program_selector'

  union all

  select 3, 'C. STUDENT EMAIL QUESTION',
         q ->> 'key',
         'helpText=' || coalesce(q ->> 'helpText','(none)'),
         'label=' || coalesce(q ->> 'label','(none)')
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
    cross join lateral jsonb_array_elements(v.definition -> 'questions') q
   where lower(coalesce(q ->> 'label','')) like '%student%email%'
      or lower(coalesce(q ->> 'helpText','')) like '%your student%'

  union all

  select 4, 'D. SCHOOL', s.name, s.id::text,
         'square=' || coalesce(s.square_location_id,'(none)')
    from public.schools s
) x
order by x.section, x.item;
