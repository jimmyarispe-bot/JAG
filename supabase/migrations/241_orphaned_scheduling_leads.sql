-- 241_orphaned_scheduling_leads.sql
--
-- Which families asked for a tour, call or assessment, were told it failed, and
-- were never emailed?
--
-- /admissions/schedule-tour, /discovery-call and /assessment all call
-- submitPublicInquiry. The RPC that creates the lead is SECURITY DEFINER so it
-- always succeeded; the two calls after it ran as the anonymous visitor, RLS hid
-- the row that had just been created, and the merge-context loader threw
-- "Lead not found". The parent saw that error. The lead was already in the
-- pipeline. Nobody was emailed, and no stage history row was written either.
--
-- These are real people who think their request did not go through.
--
-- Read-only. Nothing here changes data.

select
  l.id,
  l.first_name,
  l.last_name,
  s.name              as school,
  l.guardian_first_name,
  l.guardian_last_name,
  l.guardian_email,
  l.guardian_phone,
  l.referral_source,
  l.inquiry_date,
  l.created_at,
  l.lead_stage,
  (select count(*) from public.admissions_communications c where c.lead_id = l.id)
                      as emails_sent,
  (select count(*) from public.admissions_lead_stage_history h where h.lead_id = l.id)
                      as stage_history_rows
from public.admissions_leads l
left join public.schools s on s.id = l.school_id
where l.referral_source in ('discovery_call', 'assessment_request')
order by l.created_at desc;

-- Interpretation:
--   emails_sent = 0        -> this family was never contacted. Follow up by hand.
--   stage_history_rows = 0 -> the anonymous write was silently dropped too,
--                             which is the fingerprint of this exact bug.
