/*
  WHAT IS ACTUALLY IN v22 — read-only. Nothing here writes.

  There is no form-builder screen in the codebase. The interest form is
  rendered only at /apply, and its definition has only ever been changed by
  migrations. So "we worked on them in JAG and developed them from PDFs from
  each campus" means the campus applications were written into this definition
  directly - which is what campus-application-map-2026-09-11.md specified.

  This prints the published version's sections and questions so Jimmy can see
  at a glance whether the four campus applications are in there, rather than
  me asserting it.

  WHAT EMPTY MEANS: if section titles come back but none are campus-specific,
  the applications are somewhere else and I am still wrong about where.
*/

with published as (
  select v.id, f.title as form_title, to_jsonb(v) as j
  from public.admissions_interest_forms f
  join public.admissions_interest_form_versions v
    on v.id = f.published_version_id
),
def as (
  select
    p.form_title,
    coalesce(p.j -> 'definition', p.j -> 'schema', p.j -> 'content', p.j) as d
  from published p
)

select
  '1. sections' as check,
  coalesce(s ->> 'title', s ->> 'name', s ->> 'id', '(untitled)') as detail,
  (select count(*)::text from jsonb_array_elements(
      coalesce(s -> 'questions', s -> 'fields', '[]'::jsonb)
   )) || ' questions'
   || case when s::text like '%visibleWhen%' then '  | CONDITIONAL' else '' end
   || case when s::text like '%school_id%' then '  | keyed to campus' else '' end
   as extra
from def,
     lateral jsonb_array_elements(
       coalesce(d -> 'sections', '[]'::jsonb)
     ) as s

union all

select
  '2. the form',
  form_title,
  (select count(*)::text from jsonb_array_elements(coalesce(d -> 'sections', '[]'::jsonb)))
    || ' sections, '
    || (select coalesce(sum((select count(*) from jsonb_array_elements(
           coalesce(sec -> 'questions', sec -> 'fields', '[]'::jsonb)))), 0)::text
        from jsonb_array_elements(coalesce(d -> 'sections', '[]'::jsonb)) as sec)
    || ' questions total'
from def

order by 1, 2;
