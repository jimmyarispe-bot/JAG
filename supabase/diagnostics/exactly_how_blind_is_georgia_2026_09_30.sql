-- EXACTLY HOW BLIND IS GEORGIA?
--
-- 30 September 2026. Four staff emails have failed and every one of them
-- involves nina.gaddy@theacademyga.org. Four out of four would mean Georgia
-- has heard nothing since 17 September. Four out of forty would mean
-- something intermittent. The number decides what to do about it.
--
-- NO GUESSED FILTER. communication_type is matched against the values that
-- are actually in the table - 'email', 'staff_email', 'internal_note',
-- 'portal_notification', 'sms' - read from the data on 30 September after
-- three queries in a row quietly excluded the rows they were asking about.
--
-- sent_to can hold SEVERAL addresses in one string ("nina.gaddy@..., 
-- jimmy.arispe@..."), so matching is on `ilike`, not equality. Equality
-- would have reported zero for everyone and looked like an answer.
--
-- Times in Eastern.
--
-- Reads only.

select case
         when c.sent_to ilike '%nina%'    then '1. Nina (GA)'
         when c.sent_to ilike '%danni%'   then '2. Danni (FL)'
         when c.sent_to ilike '%heather%' then '3. Heather (Virtual + HS)'
         else '4. Jimmy'
       end                                                     as leader,
       c.template_key                                          as template,
       count(*)                                                as total,
       count(*) filter (where c.delivery_status = 'sent')       as sent,
       count(*) filter (where c.delivery_status = 'failed')     as failed,
       count(*) filter (where c.delivery_status not in ('sent','failed')
                           or c.delivery_status is null)        as other,
       round(100.0 * count(*) filter (where c.delivery_status = 'failed')
             / nullif(count(*), 0), 0)                          as pct_failed,
       (min(c.sent_at) at time zone 'America/New_York')::date    as first_et,
       (max(c.sent_at) at time zone 'America/New_York')::date    as last_et
  from public.admissions_communications c
 where c.sent_to ilike '%nina%'
    or c.sent_to ilike '%danni%'
    or c.sent_to ilike '%heather%'
    or c.sent_to ilike '%jimmy%'
 group by 1, 2
 order by 1, 5 desc, 3 desc;
