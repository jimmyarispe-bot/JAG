-- 530_a_call_at_ga_and_fl_a_meeting_at_hs_and_virtual_2026_10_09.sql
--
-- Jimmy, 9 October, reading "the tour, between the call and the application"
-- and asking what "the call" meant:
--
--     "for virtual and hs it should be virtual interest meeting;
--      for ga n fl should be interest conversation/call"
--
-- THE GAP HIS RULE EXPOSED. Five letters name this appointment. Three split
-- by campus already and say the right thing - the thank-you at 1d and both
-- chasers at 2c and 2d. The two that CONFIRM the appointment and remind a
-- family about it do not: one network row each, saying "Interest Meeting" to
-- all four campuses, including GA and FL where the previous letter has just
-- promised the mother a telephone call.
--
-- NO SLASH IN THE LETTERS. Jimmy approved that judgement: "Your interest
-- conversation/call with me is confirmed" reads like a form. A family at GA
-- is having one thing and we know which. The slash belongs where one label
-- must cover all four campuses at once - the stage dropdown, which reads
-- "interest meeting/conversation".
--
-- EVERY SENTENCE IS ALREADY HIS. "I will call you at the number you provided
-- in your inquiry form" is lifted from the GA and FL thank-you. "The Google
-- Meet link will be in your calendar invitation" from the HS and Virtual
-- one. The middle paragraph is unchanged from the network row. Nothing here
-- is new writing.
--
-- ============================================================================
-- TWO COLUMNS THAT NEARLY SHIPPED WRONG
-- ============================================================================
--
-- The first draft of this file listed only the columns it cared about.
--
--   name        is NOT NULL with no default. The insert would have failed
--               outright, which is the harmless version.
--
--   delay_hours is NOT NULL DEFAULT 0, and interview_reminder_24h lives or
--               dies by it. A campus override that omitted it would have
--               inherited 0 and SENT THE "TOMORROW" REMINDER THE INSTANT THE
--               FAMILY BOOKED - "a quick reminder about our conversation
--               tomorrow at 9:00 AM", arriving the moment they picked 9:00
--               AM, eight days early. No error, no failure, just a letter
--               that makes no sense.
--
-- Both are now carried from the network row rather than named, which is also
-- why every other column comes from `t.*` below: copy the row, change the
-- words.

begin;

do $$
declare
  v_ga uuid; v_fl uuid; v_hs uuid; v_av uuid;
  v_conf_id uuid;
  v_rem_id  uuid;
  v_middle text :=
    'During our conversation, I would like you to share everything you can about {{student_first_name}} with me. '
    || 'Additionally, I will share with you all the awesome things about our school. '
    || 'My hope is that by the end of our conversation both of us will have a pretty good idea of whether our school '
    || 'could be an environment in which {{student_first_name}} could be successful.';
begin
  select id into v_ga from public.schools where name = 'The Academy GA';
  select id into v_fl from public.schools where name = 'The Academy FL';
  select id into v_hs from public.schools where name = 'The Academy HS';
  select id into v_av from public.schools where name = 'The Academy Virtual';
  if v_ga is null or v_fl is null or v_hs is null or v_av is null then
    raise exception 'One of the four campuses was not found. Nothing written.';
  end if;

  select id into v_conf_id from public.admissions_communication_templates
   where template_key = 'interview_confirmation_email' and school_id is null;
  select id into v_rem_id from public.admissions_communication_templates
   where template_key = 'interview_reminder_24h' and school_id is null;
  if v_conf_id is null or v_rem_id is null then
    raise exception 'A network row for one of the two letters is missing. Nothing written.';
  end if;

  /* Idempotent: these four campuses must not end up with two rows each. */
  if exists (
    select 1 from public.admissions_communication_templates
     where template_key in ('interview_confirmation_email','interview_reminder_24h')
       and school_id is not null
  ) then
    raise exception 'Campus rows already exist for these two letters. Nothing written.';
  end if;

  /* ---- CONFIRMATION, GA and FL ---- */
  insert into public.admissions_communication_templates
    (school_id, template_key, name, channel, trigger_event, subject, body,
     delay_hours, is_active, category, description)
  select c.sid, t.template_key, t.name, t.channel, t.trigger_event,
         'Interest conversation confirmed — {{student_first_name}}',
'Dear {{guardian_first_name}},

Your interest conversation with me to discuss {{student_first_name}} and our school is confirmed for {{interview_datetime}}. I will call you at the number you provided in your inquiry form.

' || v_middle || '

I am looking forward to speaking with you.

Warm regards,
{{admissions_contact_name}}
{{school_name}}',
         t.delay_hours, true, t.category, t.description
    from public.admissions_communication_templates t
    cross join (select unnest(array[v_ga, v_fl]) as sid) c
   where t.id = v_conf_id;

  /* ---- CONFIRMATION, HS and Virtual ---- */
  insert into public.admissions_communication_templates
    (school_id, template_key, name, channel, trigger_event, subject, body,
     delay_hours, is_active, category, description)
  select c.sid, t.template_key, t.name, t.channel, t.trigger_event,
         'Virtual interest meeting confirmed — {{student_first_name}}',
'Dear {{guardian_first_name}},

Your virtual interest meeting with me to discuss {{student_first_name}} and our school is confirmed for {{interview_datetime}}. The Google Meet link will be in your calendar invitation.

' || v_middle || '

I am looking forward to our meeting.

Warm regards,
{{admissions_contact_name}}
{{school_name}}',
         t.delay_hours, true, t.category, t.description
    from public.admissions_communication_templates t
    cross join (select unnest(array[v_hs, v_av]) as sid) c
   where t.id = v_conf_id;

  /* ---- 24-HOUR REMINDER, GA and FL ---- */
  insert into public.admissions_communication_templates
    (school_id, template_key, name, channel, trigger_event, subject, body,
     delay_hours, is_active, category, description)
  select c.sid, t.template_key, t.name, t.channel, t.trigger_event,
         'Tomorrow — interest conversation about {{student_first_name}}',
'Dear {{guardian_first_name}},

I just wanted to send you a quick reminder about our conversation about {{student_first_name}} tomorrow at {{interview_time}}. I will call you at the number you provided. We are looking forward to it.

{{admissions_contact_name}}
{{school_name}}',
         t.delay_hours, true, t.category, t.description
    from public.admissions_communication_templates t
    cross join (select unnest(array[v_ga, v_fl]) as sid) c
   where t.id = v_rem_id;

  /* ---- 24-HOUR REMINDER, HS and Virtual ---- */
  insert into public.admissions_communication_templates
    (school_id, template_key, name, channel, trigger_event, subject, body,
     delay_hours, is_active, category, description)
  select c.sid, t.template_key, t.name, t.channel, t.trigger_event,
         'Tomorrow — virtual interest meeting for {{student_first_name}}',
'Dear {{guardian_first_name}},

I just wanted to send you a quick reminder about our virtual interest meeting about {{student_first_name}} tomorrow at {{interview_time}}. The Google Meet link will be in your calendar invitation. We are looking forward to it.

{{admissions_contact_name}}
{{school_name}}',
         t.delay_hours, true, t.category, t.description
    from public.admissions_communication_templates t
    cross join (select unnest(array[v_hs, v_av]) as sid) c
   where t.id = v_rem_id;

  raise notice 'Eight campus rows written: two letters, four campuses.';
end $$;

-- ============================================================================
-- AND THE SUBJECT AT 4f
-- ============================================================================
--
-- Jimmy, reading application_submitted_email: "here the subject need to
-- read - [student}'s application to [school name] received".
--
-- It said "We have {{student_first_name}}'s application — {{school_name}}".
-- His version puts the child first and says plainly what happened. The body
-- is untouched.

update public.admissions_communication_templates
   set subject = '{{student_first_name}}''s application to {{school_name}} received',
       updated_at = now()
 where template_key = 'application_submitted_email';

/*
 * THE NETWORK ROWS STAY, AND STAY ON. Same shape as the thank-you at 1d:
 * four campus overrides read by everybody, one network row underneath read
 * by nobody until a fifth campus exists. Switching it off would leave a new
 * school with no confirmation at all.
 */

commit;

-- ============================================================================
-- CHECK IT LANDED
-- ============================================================================
--
--   select coalesce(s.name,'(network)') as campus, t.template_key,
--          t.delay_hours, t.subject
--     from public.admissions_communication_templates t
--     left join public.schools s on s.id = t.school_id
--    where t.template_key in ('interview_confirmation_email',
--                             'interview_reminder_24h',
--                             'application_submitted_email')
--      and t.is_active
--    order by t.template_key, s.name nulls first;
--
-- Eleven rows. Every interview_reminder_24h row must read delay_hours = 24.
-- A zero there is the bug described at the top of this file.
