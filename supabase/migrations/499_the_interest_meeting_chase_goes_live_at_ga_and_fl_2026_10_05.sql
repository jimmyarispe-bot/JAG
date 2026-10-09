-- 499_the_interest_meeting_chase_goes_live_at_ga_and_fl_2026_10_05.sql
--
-- All three chase letters at steps 2c, 2d and 2e, as campus overrides at
-- The Academy GA and The Academy FL, SWITCHED ON.
--
-- Jimmy, 5 October: his own words for 2c, his own words for 2d behind the
-- existing opening line, and "2e is fine".
--
-- ── ALL THREE, OR NONE ───────────────────────────────────────────────────────
--
-- They go on in one migration on purpose. 2c is the first reminder, 2d is the
-- last letter the family ever gets automatically, and 2e is the letter that
-- tells the school leader three attempts have failed and hands her the
-- /call/<token> page.
--
-- Switch on 2c alone and a family who does not book is reminded once and then
-- forgotten, with nobody told - the escalation built to catch exactly that
-- family sitting switched off behind it. One letter and silence is worse than
-- no letter at all, because no letter at all is visible and this is not.
--
-- ── WHY ALL THREE ARE GA AND FL ONLY ─────────────────────────────────────────
--
-- 2c decides it. His wording ends:
--
--     I will call you at the number you provided in your inquiry form and at
--     the day/time you requested.
--
-- True at GA and FL, where migration 493 promises exactly that. Not true at
-- Virtual and HS, where migration 496 tells the family their meeting is a
-- Google Meet with the link in the calendar invitation.
--
-- 2E HAS TO FOLLOW THEM EVEN THOUGH ITS WORDING IS CAMPUS-NEUTRAL, and this
-- is the part worth being careful about. Its body says:
--
--     This family has been sent the booking link three times and has not
--     booked.
--     1st - {{invite_sent_at}}
--     2nd - {{reminder_1_sent_at}}
--     3rd - {{reminder_2_sent_at}}
--
-- At Virtual and HS, 2c and 2d would never have gone. The second and third
-- lines would render "not recorded" and the sentence above them would be
-- false - a letter telling Heather we chased a family three times when we
-- chased them once. So 2e is an override at the two campuses whose reminders
-- exist, and the network row stays off.
--
-- VIRTUAL AND HS THEREFORE STILL HAVE NO CHASE AT ALL. That is exactly where
-- they are today - all three network rows are off and have always been off -
-- so nothing regresses. It is a gap, it is now the only one left in step 2,
-- and it closes when Jimmy writes their two letters.
--
-- ── WHAT WAS ADDED TO HIS TEXT ───────────────────────────────────────────────
--
-- 2c  the greeting, the sign-off, {{scheduling_link}} on its own line at the
--     dash where his sentence stops, and [student] / {student} resolved to
--     {{student_first_name}}. He chose the greeting and sign-off on 5 October
--     rather than ship the text bare. Every other word is his.
--
-- 2d  the greeting, the sign-off, the link at the end where his sentence
--     stops, and ONE OPENING LINE THAT IS MINE, NOT HIS - "I am following up
--     once more about finding a time to talk about {{student_first_name}}."
--     He read it and chose to keep it. It is the only sentence in either
--     letter I wrote.
--
-- 2e  nothing. The body is copied from the network row unchanged.
--
-- REVISED 5 October, after he read it back: the last words of that sentence
-- were "thrive in our school environment", which repeats "school
-- environment" from earlier in the same sentence. They are now "thrive in
-- our type of school". His change, his words.
--
-- IF YOU ALREADY RAN AN EARLIER COPY OF THIS FILE, run it again. The upsert
-- rewrites the body, so the second run is what lands the revision; the
-- verify below reads the actual sentence so you can see which one is in
-- there rather than trusting that it took.
--
-- SUBJECTS ARE COPIED FROM THE NETWORK ROWS rather than retyped, at his
-- instruction for 2c and for consistency on the other two, so they cannot
-- drift from the originals.
--
-- ── WHAT ACTUALLY HAPPENS WHEN THIS RUNS ─────────────────────────────────────
--
-- The 11pm scan already runs nightly and already decides who is owed what; it
-- has been finding these families and writing no letters because there was no
-- active template. From tonight, at GA and FL:
--
--   day 2, no booking   2c to the family, delivered 8:00am
--   day 3, no booking   2d to the family, delivered 8:00am - the last one
--   day 4, no booking   2e to the school leader, 7:00am
--
-- EMAIL_DIVERT_TO IS STILL SET IN VERCEL, so every one of these reaches the
-- divert inbox and not a family. That is the right order: prove the chase
-- fires on real families into a safe inbox, then remove the divert.
--
-- Safe to re-run: upserts on (school_id, template_key).

begin;

do $$
declare
  sch record;
  tpl record;
  seeded integer := 0;
begin
  for sch in
    select id, name from public.schools
     where name in ('The Academy GA', 'The Academy FL')
  loop
    for tpl in
      select template_key, trigger_event, subject, channel, body
        from public.admissions_communication_templates
       where school_id is null
         and template_key in (
               'parent_reminder_interest_meeting_not_booked_1',
               'parent_reminder_interest_meeting_not_booked_2',
               'staff_interest_meeting_no_response'
             )
    loop
      insert into public.admissions_communication_templates
        (school_id, template_key, name, channel, trigger_event, subject, body,
         delay_hours, is_active, category)
      values
        (sch.id,
         tpl.template_key,
         tpl.template_key || ' (' || sch.name || ')',
         tpl.channel,
         tpl.trigger_event,
         tpl.subject,
         case tpl.template_key

           when 'parent_reminder_interest_meeting_not_booked_1' then
$c$Dear {{guardian_first_name}},

Unfortunately we have not managed to find a time to talk about {{student_first_name}}. You can pick any time that fits your schedule by clicking on the following link -

{{scheduling_link}}

During our conversation, I would like to learn about the needs of {{student_first_name}}. Also during this time, I will provide you with a description of our school environment and share with you the type of learners who are successful and thrive in our type of school.

I will call you at the number you provided in your inquiry form and at the day/time you requested.

Thank you and I look forward to our discussion.

Warm regards,
{{admissions_contact_name}}
{{school_name}}$c$

           when 'parent_reminder_interest_meeting_not_booked_2' then
$d$Dear {{guardian_first_name}},

I am following up once more about finding a time to talk about {{student_first_name}}.

If the time is wrong or something has changed on your end, I completely understand. If you could just reply to this email to let me know and I will stop bothering you. If you would like to move forward with our conversation, please click this link to schedule -

{{scheduling_link}}

Warm regards,
{{admissions_contact_name}}
{{school_name}}$d$

           /* 2e is unchanged. Copied from the network row, not retyped. */
           else tpl.body
         end,
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
  end loop;

  if seeded <> 6 then
    raise exception
      'Expected 6 rows (3 letters x 2 campuses), wrote % - a network row is missing, so migration 479 has not fully run.',
      seeded;
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT nine rows and two counts.
--
--   The Academy FL   x3   ON    his words / his words + my line / unchanged
--   The Academy GA   x3   ON    the same three
--   every campus     x3   off   the network rows, untouched
--
--   COUNT live at GA and FL: 6. Not 2, not 4. Six is the whole chase at both
--   campuses; anything less means a family can be reminded and then
--   forgotten.
--
--   COUNT live at Virtual and HS: 0. If this is anything but zero, a letter
--   is about to tell Heather we chased a family three times when we never
--   chased them at all.

select 'letter'                                                as what,
       coalesce(sc.name, 'every campus')                       as applies_to,
       replace(t.template_key, 'parent_reminder_interest_meeting_', '2x_') as detail,
       case when t.is_active then 'ON' else 'off' end          as state,
       case
         when t.body like '%thrive in our type of school.%'          then '2c — his words, revised'
         when t.body like '%thrive in our school environment.%'     then '*** 2c — THE OLD SENTENCE, RE-RUN THIS FILE ***'
         when t.body like '%I will stop bothering you%'              then '2d — his words'
         when t.body like '%sent the booking link three times%'      then '2e — unchanged'
         when t.body like '%link got lost in a busy inbox%'          then 'my old 2c draft'
         when t.body like '%that is completely fine%'                then 'my old 2d draft'
         else 'other'
       end                                                     as says

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )

union all

select 'COUNT live at GA and FL', '', count(*)::text,
       case when count(*) = 6 then 'the whole chase, both campuses'
            else '*** INCOMPLETE — A FAMILY CAN BE REMINDED AND FORGOTTEN ***' end, ''
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where sc.name in ('The Academy GA', 'The Academy FL')
   and t.is_active
   and t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )

union all

select 'COUNT live at Virtual and HS', '', count(*)::text,
       case when count(*) = 0 then 'correct — they have no chase yet'
            else '*** A LETTER WOULD CLAIM THREE ATTEMPTS THAT NEVER HAPPENED ***' end, ''
  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where sc.name in ('The Academy Virtual', 'The Academy HS')
   and t.is_active
   and t.template_key in (
         'parent_reminder_interest_meeting_not_booked_1',
         'parent_reminder_interest_meeting_not_booked_2',
         'staff_interest_meeting_no_response'
       )

 order by what, applies_to, detail;
