/*
  416 — A SHADOW DAY IS NOT AN INTERVIEW, AND WE DO NOT DO INTERVIEWS

  WHAT HAPPENED. On 17 September a shadow day was booked for Maddox Mixon at
  The Academy HS. His mother, Amy D'Amico, received this:

      Interview scheduled for Maddox:
      Date/Time: 9/24/2026, 1:00:00 PM
      Location: Main Campus
      Please prepare: recent report cards, IEP/evaluation summaries if
      applicable.

  Four things wrong in five lines. It was a shadow day, not an interview. The
  date was a machine timestamp. "Main Campus" is the fallback merge-fields.ts
  prints when a lead has no campus recorded - a default rendering as a fact.
  And nothing needed preparing.

  Heather Badger-Brown, who had scheduled no interview and conducts none:
  "The Jag is setting up interviews. We haven't interviewed prospective
  families. It didn't invite me either!"

  Jimmy, the same day: "there shouldn't be anything that says interview. we
  don't do interviews."

  WHAT THIS MIGRATION DOES. Three templates that did not exist. It does not
  touch the three existing interview templates - those are being read first
  and rewritten separately, because overwriting text nobody has looked at is
  how wording that somebody approved goes missing.

  THE MISSING STAFF NOTICE IS THE REASON HEATHER HEARD NOTHING. The code has
  dispatched `staff_interview_scheduled` on every booking since the feature
  shipped. No template has ever existed for it, so the engine found nothing
  and sent nothing - no error, no warning, no row. The same silence as
  staff_application_accepted this morning, by a different route: that one was
  on a channel that cannot send, this one simply was not there.

  Text is Jimmy's, 24 September. The line about the calendar invite is his and
  is kept deliberately: nothing in JAG creates one yet, so it refers to an
  invite a school leader sends by hand.
*/

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body, delay_hours)
values

  -- The family. Replaces the interview letter a shadow day used to send.
  (null, 'shadow_day_booked_email', 'Shadow Day Booked', 'email', 'shadow_day_scheduled',
   'Shadow day for {{student_first_name}} at {{school_name}}',
   E'Dear {{guardian_first_name}},\n\n{{student_first_name}}''s shadow day at {{school_name}} is booked for {{interview_datetime}}.\n\nA shadow day is exactly what it sounds like — {{student_first_name}} spends the day with us and participates in the same classes our current students attend. Please check the shadow day calendar invite/confirmation for specific details concerning the day. If this day/time no longer works, reply to this message and we''ll find another.\n\nWarmly,\n{{admissions_contact_name}}\n{{school_name}}',
   0),

  -- The school leader. This notice has never existed for any booking.
  (null, 'staff_shadow_day_booked', 'Staff: Shadow Day Booked', 'staff_email',
   'staff_shadow_day_scheduled',
   'Shadow day booked: {{student_name}} — {{school_name}}',
   E'{{student_name}}''s shadow day is booked.\n\nWhen: {{interview_datetime}}\nCampus: {{school_name}}\nParent: {{parent_name}} ({{parent_email}})\n\nThe record: {{lead_link}}',
   0),

  -- The same, for an interest meeting. Dispatched since the feature shipped;
  -- never existed, so nobody was ever told.
  (null, 'staff_interest_meeting_booked', 'Staff: Interest Meeting Scheduled', 'staff_email',
   'staff_interview_scheduled',
   'Interest meeting booked: {{student_name}} — {{school_name}}',
   E'{{student_name}}''s interest meeting is booked.\n\nWhen: {{interview_datetime}}\nCampus: {{school_name}}\nParent: {{parent_name}} ({{parent_email}})\n\nThe record: {{lead_link}}',
   0);

/*
  THE SHADOW-DAYS INVITATION, REWRITTEN IN JIMMY'S WORDS.

  This is the email a family gets the moment they submit their application -
  the one proved working end to end this afternoon on a test lead. The wording
  below is his, sent 24 September, replacing the text migration 247 carried
  since 15 September.

  What it now tells a family that it never did: how many days are expected,
  and that the number depends on the programme - one for Virtual, two for
  In-Person. It also tells them the calendar confirmation carries the details
  for the day, which is true because the booking happens in Google Calendar and
  Google sends that confirmation.

  TWO CORRECTIONS, both raised with him rather than made quietly:
    - "2 Shadow Days(s)" reads "2 Shadow Days".
    - "[studnets first name]" is the child's first name.

  The child's name and never a pronoun, per his instruction today, and the
  parent's first name only.
*/
update public.admissions_communication_templates
set
  subject = 'Shadow days for {{student_first_name}}',
  body = $shadow$Dear {{guardian_first_name}},

Thank you for completing {{student_first_name}}'s application. We would like to invite {{student_first_name}} to spend 1 or 2 Shadow Days with us at our school. Virtual students are required to attend 1 Shadow Day and In-Person/Campus students are required to attend 2 Shadow Days with us. During this time, {{student_first_name}} will interact with the other students, attend the same classes they do, and we trust will enjoy the day(s) with us.

You can choose your day(s) here: {{shadow_days_link}}

In your confirmation calendar notice, there will be specific information included that you will need to make the shadow day(s) at our school as enjoyable and successful for {{student_first_name}} as possible.

If none of the times work, reply to this email and we will find something that does.

Warm regards,
{{admissions_contact_name}}
{{school_name}} Admissions$shadow$,
  is_active = true
where trigger_event = 'shadow_days_invited';

/*
  PROVE IT LANDED. Three rows, or this migration failed and the next booking is
  silent again.
*/
do $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.admissions_communication_templates
  where trigger_event in (
    'shadow_day_scheduled', 'staff_shadow_day_scheduled', 'staff_interview_scheduled'
  );

  if v_count < 3 then
    raise exception
      'Expected 3 templates for the shadow-day and staff triggers, found %', v_count;
  end if;

  /* And the invitation actually carries the new wording. */
  perform 1
  from public.admissions_communication_templates
  where trigger_event = 'shadow_days_invited'
    and is_active
    and body like '%required to attend 2 Shadow Days%';
  if not found then
    raise exception 'The shadow-days invitation was not updated';
  end if;

  raise notice 'Shadow-day and staff notices in place: % templates', v_count;
end $$;
