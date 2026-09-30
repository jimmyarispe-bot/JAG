-- Every question on the live interest form, and which section holds it.
--
-- Jimmy, 29 September 2026: the inquiry is to be trimmed to the inquiry, and
-- everything else moved behind the invitation token. Before any section is
-- moved we have to know what is inside it. In particular: sections 0-3 are
-- shown to everyone and sections 4-11 are campus-conditional, but the three
-- program questions built on the 29th (program / program_hs / program_virtual)
-- must ALL stay at the inquiry, wherever they happen to sit today.
--
-- One statement. The Supabase editor shows only the last result of a
-- multi-statement script.
--
-- Export the result as CSV. 65 rows with long labels do not survive a
-- screenshot - the Jayden Roy email bodies taught us that on the 29th.

select
  (s.value ->> 'order')::int                         as sec_ord,
  s.value ->> 'key'                                  as section_key,
  coalesce(nullif(s.value ->> 'title', ''), '(untitled)') as section_title,
  qk.ord                                             as q_ord,
  qk.qkey                                            as question_key,
  q.value ->> 'type'                                 as type,
  case when (q.value ->> 'required')::boolean then 'REQUIRED' else '' end as req,
  case
    when q.value -> 'visibleWhen' is null
      or q.value -> 'visibleWhen' = 'null'::jsonb then ''
    else 'conditional'
  end                                                as q_shown,
  coalesce(q.value ->> 'label', '(no label)')        as label
from admissions_interest_forms f
join admissions_interest_form_versions v
  on v.id = f.published_version_id
 and v.lifecycle = 'published'
cross join lateral jsonb_array_elements(v.definition -> 'sections') s
cross join lateral (
  select ordinality as ord, value as qkey
  from jsonb_array_elements_text(coalesce(s.value -> 'questionKeys', '[]'::jsonb))
       with ordinality
) qk
left join lateral (
  select value
  from jsonb_array_elements(v.definition -> 'questions')
  where value ->> 'key' = qk.qkey
  limit 1
) q on true
order by 1, 4;
