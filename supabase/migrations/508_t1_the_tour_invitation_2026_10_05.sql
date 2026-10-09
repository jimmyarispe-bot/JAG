-- ============================================================================
-- 508 — T1, THE TOUR INVITATION
-- 5 October 2026
--
-- Step T1. The Academy GA and The Academy FL only. Fires on trigger event
-- tour_invitation_sent, which nothing reaches except a school leader pressing
-- "Send the tour request" on the post-call page after the interest meeting.
-- That press also moves the child to stage tour_requested; the hourly booking
-- scan moves them to tour_scheduled the moment the family books.
--
-- JIMMY'S WORDS, 5 October, revised by him and copied exactly. The only
-- change made to what he wrote is [student] -> {{student_first_name}}, which
-- is the merge field he was standing in for, and the paragraph breaks, which
-- follow 5a.
--
-- IT SHIPS SWITCHED OFF. is_active = FALSE, deliberately. The whole tour step
-- is inert behind ADMISSIONS_TOUR_GATE, which is unset. src/lib/admissions/
-- tour.ts lists four things that must be true before it is armed; this
-- migration satisfies the second of them and nothing else:
--
--   1. staff_inquiry_call_held   written, approved and ACTIVE at GA and FL
--   2. tour_invitation_sent      written, approved and ACTIVE at GA and FL   <- this file writes it, OFF
--   3. both campuses have a tour booking link - they do, since 5 September
--   4. one family walked through the whole path on purpose
--
-- WHY THE LAST SENTENCE IS SAFE TO PROMISE. The letter says the Application
-- for Admissions follows the tour. It can: reaching stage tour_completed
-- opens the invite_to_apply gate, and answering yes fires application_invited,
-- which sends the family a link to the application prefilled with what they
-- already told us. The letter also says the application must be completed
-- before shadow days are scheduled, which is the GA/FL order - shadow days
-- come two days AFTER the application at these two campuses. Virtual and HS
-- run the other way round and do not receive this letter.
--
-- ONE ROW PER CAMPUS, NO NETWORK ROW. getTemplatesForTrigger de-duplicates by
-- template_key and lets a campus row overwrite a network row. A network row
-- here would be dead text at best and a letter to a campus that runs no tours
-- at worst, so none is written.
-- ============================================================================


-- ── 1. Before ───────────────────────────────────────────────────────────────

select 'BEFORE'                              as stage,
       coalesce(sc.name, '*** NETWORK ***')  as campus,
       t.template_key,
       case when t.is_active then 'ON' else 'off' end as state
  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.trigger_event = 'tour_invitation_sent'
 order by sc.name nulls first;


-- ── 2. T1, at the two campuses that run tours ───────────────────────────────

do $$
declare
  sch    record;
  seeded integer := 0;
begin
  for sch in
    select id, name from public.schools
     where name in ('The Academy GA', 'The Academy FL')
  loop
    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    values
      (sch.id,
       'tour_invitation_email',
       'T1 Tour Invitation (' || sch.name || ')',
       'email',
       'tour_invitation_sent',
       'A tour of {{school_name}} for {{student_first_name}}',
       $letter$Dear {{guardian_first_name}},

Thank you for speaking with me about {{student_first_name}}. I would like to invite you and {{student_first_name}} to tour the school. A tour takes 30 - 60 minutes and during this time you will observe classrooms, meet some of our teachers and students, and be able to ask me any questions you'd like concerning our school.

You can choose your time here: {{tour_link}}

After the tour, I will send you the Application for Admissions and it will need to be completed before we can schedule any shadow days for {{student_first_name}}.

Warm regards,
{{admissions_contact_name}}
{{school_name}}$letter$,
       0,
       false,          -- SWITCHED OFF. Jimmy arms the tour step, not this file.
       'tour')
    on conflict (school_id, template_key) do update set
      name          = excluded.name,
      channel       = excluded.channel,
      trigger_event = excluded.trigger_event,
      subject       = excluded.subject,
      body          = excluded.body,
      delay_hours   = excluded.delay_hours,
      category      = excluded.category,
      updated_at    = now();
      -- is_active deliberately NOT in this list. If a later hand switched it
      -- on, re-running this file must not switch it back off underneath them.

    seeded := seeded + 1;
  end loop;

  if seeded <> 2 then
    raise exception
      'Expected 2 campuses (The Academy GA, The Academy FL), wrote % - check the school names.',
      seeded;
  end if;
end $$;


-- ── 3. Nothing else shares the event ────────────────────────────────────────
--
-- Two template_keys on one trigger event means two letters delivered. This is
-- the mistake migrations 494, 503 and 506 each had to undo.

do $$
declare
  keys integer;
begin
  select count(distinct template_key) into keys
    from public.admissions_communication_templates
   where trigger_event = 'tour_invitation_sent';

  if keys <> 1 then
    raise exception
      '% distinct template_key(s) on tour_invitation_sent - the family would get % letters.',
      keys, keys;
  end if;
end $$;


-- ── 4. After — read the letter itself ───────────────────────────────────────
--
-- WHAT GOOD LOOKS LIKE: two rows, The Academy FL and The Academy GA, both
-- 'off', channel email, and the body below reading exactly as approved.

select 'AFTER'            as stage,
       sc.name            as campus,
       t.template_key,
       t.channel,
       t.trigger_event,
       case when t.is_active then '*** ON — NOT EXPECTED ***' else 'off' end as state,
       t.subject,
       t.body
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.trigger_event = 'tour_invitation_sent'
 order by sc.name;
