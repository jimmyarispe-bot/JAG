-- 242_leads_never_contacted.sql
--
-- Every lead in the pipeline that has never been emailed, whatever route it came
-- in by.
--
-- 241 keyed on referral_source, which submitPublicInquiry only sets when the form
-- did not already supply one — so a request filed under a different source would
-- not have shown up there. This asks the question without that assumption:
-- who is sitting in admissions having heard nothing from us?
--
-- Expect four known rows with 0 emails: Konnor Broyld, Madison Haines, John
-- Gonzalez and Julian Oubre Towa were loaded by hand from the Monday.com export
-- (237 / 238 / 239), which writes the row only and deliberately does not run the
-- communications engine. Julian is the exception — he predates that import and
-- has real mail history, so he should show a non-zero count.
--
-- Anything else with 0 emails is a family who contacted the school and got
-- silence back.
--
-- Read-only. Nothing here changes data.

select
  l.first_name,
  l.last_name,
  s.name                as school,
  l.guardian_first_name || ' ' || l.guardian_last_name as guardian,
  l.guardian_email,
  l.guardian_phone,
  l.referral_source,
  l.lead_stage,
  l.inquiry_date,
  l.created_at,
  (select count(*) from public.admissions_communications c where c.lead_id = l.id)
                        as emails_sent
from public.admissions_leads l
left join public.schools s on s.id = l.school_id
where not exists (
  select 1 from public.admissions_communications c where c.lead_id = l.id
)
order by l.created_at desc;
