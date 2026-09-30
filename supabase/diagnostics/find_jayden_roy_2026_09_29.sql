-- WHERE IS JAYDEN ROY
--
-- 29 September 2026. Returns the pages to open, as paths, plus the state of
-- the record so you know what you are walking into before you click.
--
-- Matched loosely on the name. Exact matching is what hid Gianna Mora and
-- Rylan Jex on 19 September - both were in the JAG the whole time.
--
-- Reads only.

select x.what, x.value
from (
  select 1 as ord, 'LEAD PAGE' as what,
         '/dashboard/admissions/leads/' || l.id::text as value
    from public.admissions_leads l
   where lower(l.first_name) like '%jayden%' and lower(l.last_name) like '%roy%'

  union all
  select 2, 'CASE PAGE',
         '/dashboard/admissions/cases/' || l.id::text
    from public.admissions_leads l
   where lower(l.first_name) like '%jayden%' and lower(l.last_name) like '%roy%'

  union all
  select 3, 'PARENT PORTAL (application)',
         '/apply/portal/' || a.id::text
    from public.admissions_leads l
    join public.admissions_applications a on a.lead_id = l.id
   where lower(l.first_name) like '%jayden%' and lower(l.last_name) like '%roy%'

  union all
  select 4, 'WHO / WHERE',
         l.first_name || ' ' || l.last_name
           || '   campus=' || coalesce(s.name, '(none)')
           || '   stage=' || coalesce(l.lead_stage, '(none)')
           || '   guardian=' || coalesce(l.guardian_email, '(none)')
    from public.admissions_leads l
    left join public.schools s on s.id = l.school_id
   where lower(l.first_name) like '%jayden%' and lower(l.last_name) like '%roy%'

  union all
  select 5, 'APPLICATION STATE',
         'status=' || coalesce(a.application_status, '(none)')
           || '   fee=' || coalesce(a.application_fee_status, '(none)')
           || '   $' || to_char(coalesce(a.application_fee_cents,0) / 100.0, 'FM999990.00')
           || '   submitted=' || coalesce(a.submitted_at::text, 'no')
    from public.admissions_leads l
    join public.admissions_applications a on a.lead_id = l.id
   where lower(l.first_name) like '%jayden%' and lower(l.last_name) like '%roy%'

  union all
  -- If nothing above returns, this row is the answer.
  select 9, 'IF YOU SEE ONLY THIS ROW',
         'No lead matching Jayden Roy exists. Search the leads list by surname.'
   where not exists (
     select 1 from public.admissions_leads l
      where lower(l.first_name) like '%jayden%' and lower(l.last_name) like '%roy%'
   )
) x
order by x.ord;
