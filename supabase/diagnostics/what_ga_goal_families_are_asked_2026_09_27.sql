-- What a Georgia family is asked, and what the GA GOAL tick adds.
--
-- ONE statement, read only, against the version that is LIVE right now - not
-- against the seed migrations, which describe what was intended rather than
-- what is published.
--
-- HOW TO READ IT
--   'GA section'   : a section only Georgia families see, with its own rule.
--   'always for GA': a question inside it with no further condition - every
--                    Georgia family is asked this, GA GOAL or not.
--   'GA GOAL only' : a question whose own rule mentions the GA GOAL funding
--                    source. These appear only when the family ticks it.
--   type 'file'    : a DOCUMENT the family must upload.
--   required = true: they cannot submit without it, once it is shown.

with live as (
  select v.definition
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v
      on v.id = f.published_version_id
),
ga as (
  select id::text as school_id from public.schools
   where lower(trim(name)) = 'the academy ga'
),
sections as (
  select s->>'key' as section_key,
         s->>'title' as section_title,
         coalesce(s->'visibleWhen'::text, 'null') as section_rule,
         (s->'visibleWhen')::text as rule_text,
         jsonb_array_elements_text(s->'questionKeys') as question_key,
         (s->>'order')::int as section_order
    from live, jsonb_array_elements(definition->'sections') s
),
questions as (
  select q->>'key' as key,
         q->>'label' as label,
         q->>'type' as type,
         (q->>'required')::boolean as required,
         (q->'visibleWhen')::text as question_rule,
         (q->>'order')::int as question_order
    from live, jsonb_array_elements(definition->'questions') q
)
select case
         when qs.question_rule ilike '%goal%' then 'GA GOAL only'
         when sc.rule_text ilike '%goal%'     then 'GA GOAL only'
         else 'always for GA'
       end as when_shown,
       sc.section_title,
       qs.label as question,
       qs.type,
       qs.required,
       coalesce(qs.question_rule, 'no extra condition') as its_own_rule
  from sections sc
  join questions qs on qs.key = sc.question_key
  left join ga on true
 where sc.rule_text ilike '%' || ga.school_id || '%'
    or sc.rule_text ilike '%goal%'
    or qs.question_rule ilike '%goal%'
 order by sc.section_order, qs.question_order;
