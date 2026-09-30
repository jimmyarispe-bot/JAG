-- Every campus-conditional question in the live form, both states.
--
-- Needed before the residency work: the GA path has been read, the FL path
-- has not, and writing "resident of Florida sees the Florida block" without
-- knowing what Florida's block actually asks is how a Step Up family gets
-- asked for the wrong documents.
--
-- ONE statement, read only, against the published version.
--
-- Campus uuids are swapped for names in the rule text, so a condition reads
-- as "The Academy FL" rather than as a uuid nobody can check by eye.

with live as (
  select v.definition
    from public.admissions_interest_forms f
    join public.admissions_interest_form_versions v on v.id = f.published_version_id
),
campus as (
  select id::text as id, name from public.schools
),
sections as (
  select s->>'key'   as section_key,
         s->>'title' as section_title,
         (s->'visibleWhen')::text as section_rule,
         (s->>'order')::int as section_order,
         jsonb_array_elements_text(s->'questionKeys') as question_key
    from live, jsonb_array_elements(definition->'sections') s
),
questions as (
  select q->>'key' as key,
         q->>'label' as label,
         q->>'type' as type,
         (q->>'required')::boolean as required,
         (q->'visibleWhen')::text as question_rule,
         (q->>'order')::int as question_order,
         jsonb_array_length(coalesce(q->'options', '[]'::jsonb)) as option_count
    from live, jsonb_array_elements(definition->'questions') q
),
named as (
  select sc.section_order,
         sc.section_title,
         sc.section_rule,
         qs.*
    from sections sc
    join questions qs on qs.key = sc.question_key
)
select n.section_title,
       left(n.label, 70) as question,
       n.type,
       n.required,
       n.option_count as choices,
       -- the section's rule, campus ids read as names
       coalesce(
         (select string_agg(replace(n.section_rule, c.id, c.name), '' )
            from campus c
           where n.section_rule like '%' || c.id || '%'),
         n.section_rule,
         'always shown'
       ) as section_shown_when,
       coalesce(
         (select string_agg(replace(n.question_rule, c.id, c.name), '')
            from campus c
           where n.question_rule like '%' || c.id || '%'),
         n.question_rule,
         'no extra condition'
       ) as question_shown_when
  from named n
 where n.section_rule is not null
    or n.question_rule is not null
 order by n.section_order, n.question_order;
