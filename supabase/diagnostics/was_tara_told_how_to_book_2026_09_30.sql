-- DID THE INQUIRY EMAIL TELL THE PARENT HOW TO BOOK?
--
-- 30 September 2026. Jimmy: "can you confirm when we received the inquiry
-- form that the parent was sent them email to schedule their interest
-- meeting?"
--
-- The public form PROMISES it, in its own words: "After submitting, you will
-- receive an email with a link to signup for a tour, in-person, or virtual
-- meeting." So the question is not whether an email was sent - two were -
-- but whether either of them carried a way to book.
--
-- Every family who inquired on 30 September, not only Julian's, because a
-- promise the form makes to one parent it makes to all of them.
--
-- Reads only. Export as CSV: bodies are long and a screenshot will cut them.

select l.first_name || ' ' || l.last_name          as child,
       coalesce(s.name, '(no campus)')             as campus,
       c.sent_at                                   as sent_at,
       c.sent_to                                   as sent_to,
       c.subject                                   as subject,
       -- Does the body offer a way to book anything at all?
       case
         when c.body ilike '%shadow%'    then 'yes - shadow'
         when c.body ilike '%tour%'      then 'yes - tour'
         when c.body ilike '%schedule%'  then 'yes - schedule'
         when c.body ilike '%book%'      then 'yes - book'
         when c.body ilike '%meeting%'   then 'yes - meeting'
         when c.body ilike '%calendar%'  then 'yes - calendar'
         else 'NO BOOKING LANGUAGE'
       end                                          as booking_words,
       -- And a link of any kind?
       case when c.body ilike '%http%' then 'has a link' else 'NO LINK' end
                                                    as has_link,
       c.body                                       as full_body
  from public.admissions_communications c
  join public.admissions_leads l on l.id = c.lead_id
  left join public.schools s on s.id = l.school_id
 where c.sent_at >= date '2026-09-30'
   and c.sent_to ilike '%@%'
   and c.sent_to not ilike '%theacademyway.org%'
   and c.sent_to not ilike '%theacademyga.org%'
 order by c.sent_at;
