-- 493_ga_and_fl_say_it_is_a_phone_call_2026_10_04.sql
--
-- A campus override of inquiry_thank_you_email for The Academy GA and
-- The Academy FL only. HS and Virtual are untouched and keep the current
-- letter until Jimmy writes theirs.
--
-- THE WORDS ARE JIMMY'S, 4 October 2026. Three changes:
--
--   1. The middle paragraph is replaced. It now says plainly that the next
--      step is a PHONE CALL, that he will call the number on the inquiry
--      form, and what the parent is being asked to talk about.
--
--   2. Deleted: "We will use this time together to learn about
--      {{student_name}} in your own words, answer your questions, and explain
--      how we support students with learning differences."
--
--   3. Deleted: "If none of those times work, simply reply to this email and
--      let me know."
--
-- TWO DEPARTURES FROM HIS TEXT, BOTH NAMED.
--
--   a) He wrote "[student name]". Rendered as {{student_first_name}}, not
--      {{student_name}}. Every family letter he has rewritten this week uses
--      the first name, and the full name already appears one line above in
--      "We received your inquiry for {{student_name}}" - which is the right
--      place for it, because it confirms we have the right child. Say the
--      word and it is one token.
--
--   b) A double space after "for [student name]." - a paste artefact.
--
-- WHY AN OVERRIDE AND NOT AN EDIT. The engine's getTemplatesForTrigger reads
-- the network row and the campus row together, sorts network first, and
-- de-duplicates by template_key - so exactly one survives per key and the
-- campus one wins. GA and FL get this; HS and Virtual get the network row
-- they have today. Nothing else changes.
--
-- THE TRIGGER EVENT IS COPIED FROM THE NETWORK ROW rather than written in,
-- so this works whether or not migration 489 has run. 489 moves this letter
-- from 'inquiry_submitted' to 'interest_meeting_link_sent', and it has no
-- school_id filter, so it would carry these overrides with it either way.
-- Copying the value removes the ordering question entirely.
--
-- ONE THING TO WATCH, NOT FIXED HERE. "I will give you a call at the number
-- you provided in the inquiry form" is a promise that depends on the family
-- having given one. The form takes a telephone number and does not require
-- it. A family who left it blank reads a sentence about a number they never
-- supplied. The query beside this file counts how often that happens.
--
-- Safe to re-run: the insert upserts on (school_id, template_key).

begin;

do $$
declare
  sch record;
  v_trigger text;
  v_subject text;
  seeded integer := 0;
begin
  -- Whatever the network row currently fires on, these fire on too.
  select trigger_event, subject
    into v_trigger, v_subject
    from public.admissions_communication_templates
   where template_key = 'inquiry_thank_you_email'
     and school_id is null;

  if v_trigger is null then
    raise exception 'No network inquiry_thank_you_email row found - nothing to override.';
  end if;

  for sch in
    select id, name from public.schools
     where name in ('The Academy GA', 'The Academy FL')
  loop
    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    values
      (sch.id,
       'inquiry_thank_you_email',
       'Inquiry Thank You - phone call (' || sch.name || ')',
       'email',
       v_trigger,
       v_subject,
       $letter$Dear {{guardian_first_name}},

Thank you for your interest in {{school_name}}. We received your inquiry for {{student_name}}.

The next step is to schedule a phone conversation so you can share your child's needs with me and the type of school environment you want for {{student_first_name}}. Please click the following link to schedule our conversation. I will give you a call at the number you provided in the inquiry form.

{{scheduling_link}}

Warm regards,
{{admissions_contact_name}}
{{school_name}}$letter$,
       0, true, 'inquiry')
    on conflict (school_id, template_key) do update set
      name          = excluded.name,
      channel       = excluded.channel,
      trigger_event = excluded.trigger_event,
      subject       = excluded.subject,
      body          = excluded.body,
      delay_hours   = excluded.delay_hours,
      is_active     = true,
      category      = excluded.category,
      updated_at    = now();

    seeded := seeded + 1;
  end loop;

  if seeded <> 2 then
    raise exception 'Expected 2 campuses, wrote % - check the school names.', seeded;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT four rows and a count.
--
--   The Academy FL   the new letter, ON, 'phone call'
--   The Academy GA   the new letter, ON, 'phone call'
--   every campus     the old letter, ON, 'the old wording' — correct, it is
--                    what HS and Virtual still receive
--   every campus     inquiry_thank_you_email_no_link, unchanged
--
--   COUNT trigger events in use: 1. If it reads 2, the overrides and the
--   network row are on different events and GA or FL would get BOTH letters
--   or neither.

select 'letter'                                               as what,
       coalesce(sc.name, 'every campus')                      as applies_to,
       t.template_key                                         as detail,
       case when t.is_active then 'ON' else 'off' end         as state,
       case
         when t.body like '%phone conversation%' then 'phone call — Jimmy''s words'
         when t.body like '%We will use this time together%' then 'the old wording'
         else 'other'
       end                                                    as wording,
       t.trigger_event,
       t.body

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in ('inquiry_thank_you_email', 'inquiry_thank_you_email_no_link')

union all

select 'COUNT trigger events in use',
       '',
       count(distinct t.trigger_event)::text,
       case when count(distinct t.trigger_event) = 1
            then 'one event — the override replaces the network row cleanly'
            else '*** TWO EVENTS — GA OR FL WOULD GET BOTH OR NEITHER ***' end,
       '', '', ''
  from public.admissions_communication_templates t
 where t.template_key = 'inquiry_thank_you_email'

 order by what, applies_to, detail;
