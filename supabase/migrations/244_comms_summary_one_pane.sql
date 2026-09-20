-- 244_comms_summary_one_pane.sql
--
-- 243 asked four questions as four statements, and the Supabase editor only shows
-- the last one's results -- so all I learned was pane 4: 285 uncontacted leads
-- created in August 2026, 3 in September. My fault for splitting it.
--
-- Everything in one result set this time. Read the "metric" column.
--
-- What I am trying to settle: are 288 families genuinely un-emailed, or is the
-- communications table simply not written? The August cluster of 285 suggests a
-- bulk import that never ran the communications engine -- which would be normal
-- and not an emergency -- but that is a guess until these numbers say so.
--
-- Read-only.

select 'leads_total' as metric, count(*)::text as value, 1 as ord
from public.admissions_leads
union all
select 'comms_rows_total', count(*)::text, 2
from public.admissions_communications
union all
select 'leads_with_comms', count(distinct lead_id)::text, 3
from public.admissions_communications
union all
select 'leads_without_comms', count(*)::text, 4
from public.admissions_leads l
where not exists (select 1 from public.admissions_communications c where c.lead_id = l.id)
union all
select 'comms_first_sent', coalesce(min(sent_at)::text, '(none)'), 5
from public.admissions_communications
union all
select 'comms_last_sent', coalesce(max(sent_at)::text, '(none)'), 6
from public.admissions_communications
union all
-- Delivery breakdown, one row per combination.
select
  'delivery: ' || communication_type || ' / ' || delivery_status ||
    case when is_staff_notification then ' (staff)' else '' end,
  count(*)::text,
  7
from public.admissions_communications
group by communication_type, delivery_status, is_staff_notification
union all
-- Where the uncontacted leads came from. A single dominant referral_source means
-- one bulk import, not 285 separate families who were ignored.
select
  'uncontacted source: ' || coalesce(l.referral_source, '(null)'),
  count(*)::text,
  8
from public.admissions_leads l
where not exists (select 1 from public.admissions_communications c where c.lead_id = l.id)
group by l.referral_source
union all
-- Same question by day. A single day holding hundreds of rows is an import.
select
  'uncontacted created on ' || l.created_at::date::text,
  count(*)::text,
  9
from public.admissions_leads l
where not exists (select 1 from public.admissions_communications c where c.lead_id = l.id)
group by l.created_at::date
order by ord, metric;
