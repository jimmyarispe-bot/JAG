-- HOW THE THREE PROGRAM QUESTIONS ARE GATED
--
-- 29 September 2026. The first read turned up something the screenshot could
-- not show: this form has THREE program_selector questions, not one.
--
--   program           no options declared - inherits the network default five
--   program_hs        Only Virtual, Hybrid (in-person + virtual)
--   program_virtual   Only Virtual
--
-- So campus-specific program questions already exist, and the general
-- `program` question is the one showing all five to Georgia. Which of them
-- Jimmy's change belongs in depends entirely on when each is shown - and that
-- is a question-level and section-level rule this read has not yet seen.
--
-- WRITING THE MIGRATION WITHOUT THIS WOULD BE GUESSING. If `program` is shown
-- to every campus, then the high school currently sees TWO program questions
-- and its six options belong in one of them, not both. If `program` is hidden
-- for HS and Virtual, it is the FL/GA question and only it needs narrowing.
-- Those are different migrations and the difference is not visible from the
-- page.
--
-- One statement, because the Supabase editor shows only the last result.
-- Run against a local Postgres 16 with the same table shapes before sending.
-- Reads only.
--
-- WHAT TO LOOK FOR, per question:
--   1. shown when        the question's own rule. "ALWAYS" means every campus.
--   2. lives in section  and that SECTION's rule - a question with no rule
--                        inside a gated section is still gated.
--   3. options           one row each, or "NONE DECLARED".
--   4. helpText today    hs_student_email only - the line Jimmy wants
--                        appended goes on the end of this exact text.

with live as (
  select v.definition as def
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
),
q as (
  select qq as question, qq ->> 'key' as key, (qq ->> 'order')::int as ord
    from live cross join lateral jsonb_array_elements(def -> 'questions') qq
   where qq ->> 'type' = 'program_selector' or qq ->> 'key' = 'hs_student_email'
),
sec as (
  select ss ->> 'key' as section_key, ss ->> 'title' as section_title,
         coalesce((ss -> 'visibleWhen')::text,'always shown') as section_rule,
         jsonb_array_elements_text(coalesce(ss -> 'questionKeys','[]'::jsonb)) as qkey
    from live cross join lateral jsonb_array_elements(def -> 'sections') ss
)
select y.key as question_key, y.ord as question_order, y.fact, y.value
from (
  select q.key, q.ord, '1. shown when' as fact,
         coalesce((q.question -> 'visibleWhen')::text,'ALWAYS - no rule on the question') as value
    from q
  union all
  select q.key, q.ord, '2. lives in section',
         coalesce(s.section_key || '  "' || s.section_title || '"  rule=' || s.section_rule,
                  '** IN NO SECTION - never rendered **')
    from q left join sec s on s.qkey = q.key
  union all
  select q.key, q.ord, '3. option: ' || (o ->> 'value'),
         'option_rule=' || coalesce((o -> 'visibleWhen')::text,'none')
    from q cross join lateral jsonb_array_elements(coalesce(q.question -> 'options','[]'::jsonb)) o
  union all
  select q.key, q.ord, '3. options',
         '** NONE DECLARED - inherits the network default list **'
    from q
   where coalesce(jsonb_array_length(q.question -> 'options'),0) = 0
     and q.question ->> 'type' = 'program_selector'
  union all
  select q.key, q.ord, '4. helpText today', coalesce(q.question ->> 'helpText','(none)')
    from q where q.key = 'hs_student_email'
) y
order by y.ord, y.key, y.fact;
