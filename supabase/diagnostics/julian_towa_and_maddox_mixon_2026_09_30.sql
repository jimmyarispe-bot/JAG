-- JULIAN TOWA AND MADDOX MIXON - what we hold, and where to open it
--
-- 30 September 2026. Jimmy: "what have we received from each of them? where
-- can i find their information".
--
-- Matched LOOSELY on the name. Exact matching is what hid Gianna Mora and
-- Rylan Jex on 19 September - both were in the JAG the whole time. A spelling
-- we did not expect is the likeliest reason a child looks missing.
--
-- One statement: the Supabase editor shows only the last result of a script.
--
-- Reads only. Nothing here changes anything.

with kid as (
  select l.id,
         l.first_name || ' ' || l.last_name as child,
         case when lower(l.first_name) like '%julian%' then 1 else 2 end as who,
         l.school_id, l.lead_stage, l.guardian_email, l.created_at,
         l.application_access_token
    from public.admissions_leads l
   where (lower(l.first_name) like '%julian%' and lower(l.last_name) like '%tow%')
      or (lower(l.first_name) like '%maddox%' and lower(l.last_name) like '%mix%')
),
app as (
  select distinct on (a.lead_id) a.*
    from public.admissions_applications a
    join kid k on k.id = a.lead_id
   order by a.lead_id, a.created_at desc
)

select x.who, x.child, x.ord, x.what, x.value
from (
  select k.who, k.child, 1 as ord, 'WHO / WHERE' as what,
         'campus=' || coalesce(s.name, '(none)')
           || '   stage=' || coalesce(k.lead_stage, '(none)')
           || '   guardian=' || coalesce(k.guardian_email, '(NONE ON RECORD)')
           || '   first seen=' || coalesce(k.created_at::date::text, '?') as value
    from kid k left join public.schools s on s.id = k.school_id

  union all
  select k.who, k.child, 2, 'LEAD PAGE',
         'https://theacademyway.thejag.org/dashboard/admissions/leads/' || k.id::text
    from kid k

  union all
  select k.who, k.child, 3, 'CASE PAGE',
         'https://theacademyway.thejag.org/dashboard/admissions/cases/' || k.id::text
    from kid k

  union all
  select k.who, k.child, 4, 'APPLICATION',
         case when a.id is null then 'NONE - no application row, so nothing to pay on'
         else 'status=' || coalesce(a.application_status, '(none)')
           || '   fee=' || coalesce(a.application_fee_status, '(none)')
           || '   $' || to_char(coalesce(a.application_fee_cents,0)/100.0, 'FM999990.00')
           || '   submitted=' || coalesce(a.submitted_at::text, 'NO')
         end
    from kid k left join app a on a.lead_id = k.id

  union all
  select k.who, k.child, 5, 'INVITED TO APPLY?',
         case when k.application_access_token is null
              then 'NO - no application link has ever been minted for this family'
              else 'YES - their link is https://apply.theacademyway.org/apply/start/'
                   || k.application_access_token end
    from kid k

  union all
  -- What the family actually sent us, one row per submission.
  select k.who, k.child, 6, 'RECEIVED: form',
         coalesce(sub.source, '(source not recorded)')
           || '   on ' || coalesce(sub.submitted_at::date::text, '?')
           || '   answers=' || (
                select count(*) from public.admissions_interest_answers ans
                 where ans.submission_id = sub.id)::text
    from kid k
    join public.admissions_interest_submissions sub on sub.lead_id = k.id

  union all
  select k.who, k.child, 7, 'RECEIVED: nothing',
         'No form submission on record for this child.'
    from kid k
   where not exists (
     select 1 from public.admissions_interest_submissions sub where sub.lead_id = k.id)

  union all
  -- Documents, found by lead as well as by application: migration 326 put
  -- lead_id on this table precisely so an upload before acceptance is not lost.
  select k.who, k.child, 8, 'RECEIVED: document',
         d.document_type || coalesce(' / ' || d.document_subtype, '')
           || '   "' || d.file_name || '"'
           || '   on ' || coalesce(d.created_at::date::text, '?')
    from kid k
    join public.application_documents d
      on d.lead_id = k.id or d.application_id in (select id from app where lead_id = k.id)

  union all
  select k.who, k.child, 9, 'RECEIVED: no documents',
         'Nothing uploaded.'
    from kid k
   where not exists (
     select 1 from public.application_documents d
      where d.lead_id = k.id
         or d.application_id in (select id from app where lead_id = k.id))

  union all
  -- What WE sent THEM, and whether it landed. FL has never delivered a single
  -- email, so "sent" is not the same as "arrived".
  select k.who, k.child, 10, 'WE SENT',
         coalesce(c.sent_at::date::text, '?') || '   ' || left(c.subject, 46)
           || '   -> ' || c.sent_to
    from kid k
    join public.admissions_communications c on c.lead_id = k.id

  union all
  select k.who, k.child, 11, 'WE SENT: nothing',
         'No email has ever been sent to this family.'
    from kid k
   where not exists (
     select 1 from public.admissions_communications c where c.lead_id = k.id)

  union all
  -- If a child is genuinely absent, say which one rather than returning fewer
  -- rows and leaving somebody to work out who is missing.
  select 1, 'Julian Towa', 0, 'NOT FOUND',
         'No lead matches Julian Towa. Try the leads list by surname - the '
         'spelling on the record may differ.'
   where not exists (select 1 from kid where who = 1)

  union all
  select 2, 'Maddox Mixon', 0, 'NOT FOUND',
         'No lead matches Maddox Mixon. Try the leads list by surname - the '
         'spelling on the record may differ.'
   where not exists (select 1 from kid where who = 2)
) x
order by x.who, x.ord, x.value;
