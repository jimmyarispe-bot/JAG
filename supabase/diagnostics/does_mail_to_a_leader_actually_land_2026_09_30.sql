-- DOES MAIL TO A SCHOOL LEADER ACTUALLY LAND?
--
-- 30 September 2026. Replaces is_the_school_leader_actually_told, which
-- filtered on is_staff_notification = true and so returned only the in-app
-- "staff" rows - not the emails to Heather, Nina and Danni, which are the
-- ones the question was about. My filter excluded the evidence.
--
-- THE REAL QUESTION. Two of the four campus leaders are on domains that are
-- not theacademyway.org:
--
--   nina.gaddy@theacademyga.org    the domain that silently failed BOTH of
--                                  Nina's decision emails on 22 September -
--                                  she was asked to decide on Jayden Roy
--                                  twice and never saw either request
--   danni.treu@theacademyfl.org    a domain nothing has been observed to
--                                  deliver to; FL has never delivered an
--                                  email at all
--
-- If those two never arrive, then two campuses have been running blind since
-- the JAG started mailing them, and neither leader had any way to know.
--
-- Grouped by ADDRESS, not by child, because the question is about a domain,
-- not about one family. Every email ever sent to each address.
--
-- Reads only.

select c.sent_to                                        as address,
       count(*)                                         as emails,
       count(*) filter (where c.delivery_status = 'sent')      as sent,
       count(*) filter (where c.delivery_status = 'delivered') as delivered,
       count(*) filter (where c.delivery_status = 'failed')    as failed,
       count(*) filter (where c.delivery_status is null)       as no_status,
       string_agg(distinct coalesce(c.delivery_status, '(null)'), ', ')
                                                        as statuses_seen,
       (min(c.sent_at) at time zone 'America/New_York')::date  as first_et,
       (max(c.sent_at) at time zone 'America/New_York')::date  as last_et
  from public.admissions_communications c
 where c.communication_type = 'email'
   and c.sent_to ilike '%@%'
 group by c.sent_to
 order by
   -- Our own people first: they are the ones who are supposed to be acting
   -- on these, and a failure there stops a family's whole journey.
   case when c.sent_to ilike '%theacademy%' then 0 else 1 end,
   count(*) desc;
