-- WHAT IS ACTUALLY IN admissions_communications
--
-- 30 September 2026. Written after filtering the evidence out of my own
-- query three times in a row:
--
--   is_staff_notification = true   returned only the in-app "staff" rows and
--                                  none of the emails to Heather or Nina
--   communication_type = 'email'   returned no @theacademy address at all,
--                                  though we had both read those rows an
--                                  hour earlier
--   sent_at read as local          put every timestamp four hours ahead
--
-- Each time I guessed a column's vocabulary and then believed the result.
-- This query guesses nothing. It filters on NOTHING. It reports what values
-- these four columns actually hold and how the staff rows differ from the
-- family rows, so the next question can be asked against the real shape.
--
-- Reads only.

select coalesce(c.communication_type, '(null)')                as type,
       case
         when c.sent_to is null            then '(null)'
         when c.sent_to not like '%@%'     then 'NOT AN ADDRESS: ' || left(c.sent_to, 24)
         when c.sent_to ilike '%theacademy%' then 'a staff address'
         else 'a family address'
       end                                                     as recipient_kind,
       coalesce(c.is_staff_notification::text, '(null)')        as staff_flag,
       coalesce(c.delivery_status, '(null)')                    as delivery,
       count(*)                                                 as rows,
       left(min(c.sent_to), 40)                                 as example_recipient,
       left(min(c.template_key), 34)                            as example_template,
       (min(c.sent_at) at time zone 'America/New_York')::date    as first_et,
       (max(c.sent_at) at time zone 'America/New_York')::date    as last_et
  from public.admissions_communications c
 group by 1, 2, 3, 4
 order by 1, 2, 3, 4;
