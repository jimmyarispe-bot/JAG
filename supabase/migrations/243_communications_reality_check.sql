-- 243_communications_reality_check.sql  (v2 -- real column names)
--
-- v1 grouped by "channel" and "status". Neither exists. The real columns are
-- communication_type (066) and delivery_status (068). That is the third time
-- today I have written a query from what the TypeScript calls a field instead of
-- what the table calls it, and because Supabase runs the whole script as one
-- statement batch, that one bad name threw away all four answers.
--
-- The question this answers: 242 found 288 leads with no row in
-- admissions_communications. Two very different explanations, opposite responses:
--
--   A) 288 families really were never contacted  -> operational emergency
--   B) the table is barely written                -> logging defect, 288 is noise
--
-- Do not act on the 288 until this says which.
--
-- Read-only.

-- 1. Scale. If leads_total is ~292 and leads_with_comms is a handful, the table
--    is not being written and 242's list means nothing about contact.
select
  (select count(*) from public.admissions_leads)          as leads_total,
  (select count(*) from public.admissions_communications) as comms_rows_total,
  (select count(distinct lead_id) from public.admissions_communications)
                                                          as leads_with_comms,
  (select count(*) from public.admissions_leads l
     where not exists (select 1 from public.admissions_communications c
                       where c.lead_id = l.id))           as leads_without_comms;

-- 2. When was anything last logged? A table that stops dead on a date marks the
--    day the logging broke, not the day the school stopped caring.
select
  min(sent_at) as first_sent,
  max(sent_at) as last_sent,
  min(created_at) as first_created,
  max(created_at) as last_created
from public.admissions_communications;

-- 3. What does it record, and did any of it reach a person? A pile stuck in
--    'queued' or 'failed' is its own answer.
select
  communication_type,
  delivery_status,
  is_staff_notification,
  count(*) as rows
from public.admissions_communications
group by communication_type, delivery_status, is_staff_notification
order by rows desc;

-- 4. Age of the uncontacted leads. A backlog from months ago is a different
--    problem from everything since August.
select
  date_trunc('month', l.created_at)::date as month,
  count(*)                                as uncontacted_leads
from public.admissions_leads l
where not exists (
  select 1 from public.admissions_communications c where c.lead_id = l.id
)
group by 1
order by 1 desc;
