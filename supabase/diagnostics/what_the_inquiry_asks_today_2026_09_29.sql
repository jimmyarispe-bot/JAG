-- What the live interest form asks today, section by section.
--
-- Written to decide the inquiry/application split. Jimmy, 29 September 2026:
-- the public form at https://apply.theacademyway.org/apply shows GA GOAL
-- scholarship prose, a signature, a GTID, an award amount, file uploads and
-- eligibility attestations - all at the inquiry phase.
--
-- One statement. The Supabase editor shows only the LAST result of a
-- multi-statement script, which has cost us two rounds already.
--
-- Rule, learned the hard way four times this week: read the create statement
-- before writing the select. The live version is the one
-- admissions_interest_forms.published_version_id POINTS AT - not "any version
-- whose lifecycle is published".

select
  v.version_number                                       as ver,
  (s.value ->> 'order')::int                              as ord,
  s.value ->> 'key'                                       as section_key,
  left(coalesce(s.value ->> 'title', ''), 44)             as title,
  jsonb_array_length(coalesce(s.value -> 'questionKeys', '[]'::jsonb)) as qs,
  case
    when s.value -> 'visibleWhen' is null
      or s.value -> 'visibleWhen' = 'null'::jsonb then 'always'
    else 'conditional'
  end                                                     as shown,
  (
    select count(*)
    from jsonb_array_elements(v.definition -> 'questions') q
    where q.value ->> 'key' in (
      select jsonb_array_elements_text(coalesce(s.value -> 'questionKeys', '[]'::jsonb))
    )
      and q.value ->> 'type' in ('file', 'signature', 'consent')
  )                                                       as heavy
from admissions_interest_forms f
join admissions_interest_form_versions v
  on v.id = f.published_version_id
 and v.lifecycle = 'published'
cross join lateral jsonb_array_elements(v.definition -> 'sections') s
order by 2;
