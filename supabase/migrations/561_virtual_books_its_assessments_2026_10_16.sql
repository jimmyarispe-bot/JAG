-- ============================================================================
-- 561  VIRTUAL BOOKS ITS ASSESSMENTS
--      16 October 2026
-- ============================================================================
--
-- JIMMY, 16 OCTOBER 2026, giving the sentence:
--
--   "in the email sent to parents confirming receipt of the admissions
--    application include a sentence in there that says - the next step in the
--    process is to click on the 2 links below to schedule [student]'s Math and
--    Structure Literacy Assessments. After these have been completed, Heather
--    will reach out to you with next steps."
--
-- and then, shown the rendered mockup: "this visual is exactly what we need in
-- the email". So the mockup IS the letter, and this is it.
--
-- ── A VIRTUAL ROW, NOT AN EDIT TO THE NETWORK ROW ───────────────────────────
--
-- application_submitted_email is ONE ROW serving all five campuses. Putting
-- the assessment sentence in it would tell a GA and an FL parent to book two
-- assessments their school does not run. Virtual gets its own row, which is
-- what inquiry_thank_you_email and interview_confirmation_email already do at
-- this campus, and the network row is left exactly as it is.
--
-- HS DOES NOT GET ONE. Jimmy: "we have some revisions for virtual. not hs."
-- This also corrects LEAD_STAGES, where the retired assessment_scheduled stage
-- is still labelled "Assessment Scheduled - HS and Virtual" from his note of
-- 9 October. It is Virtual only, and it is two assessments rather than one.
--
-- EVERY VIRTUAL CHILD IS THE FULL-SCHOOL PROGRAM, so his "for the full-school
-- program" needs no condition in the letter: academy_virtual is the only
-- program code the campus uses, across all 161 of its leads, and its label is
-- literally "The Academy Virtual - Full School Program". HS is academy_hs.
--
-- ── TWO SENTENCES ARE DELIBERATELY NOT IN THE VIRTUAL ROW ───────────────────
--
-- The network row says:
--
--   "I will review it myself as quickly as possible and then email you with
--    the next step, which normally involves scheduling your Shadow Days."
--   "There is nothing else for you to do in the meantime."
--
-- A parent cannot be told to click two links and that there is nothing to do.
-- Both are dropped from the Virtual row and both survive untouched on the
-- network row for GA and FL. The guard below checks that they survive.
--
-- ── WHY THE BODY IS HTML WHEN THE NETWORK ROW IS PLAIN TEXT ─────────────────
--
-- Because the two links must be BUTTONS and they are not merge fields - they
-- are two fixed Google appointment schedules, one per teacher. letter-html
-- promotes a paragraph whose only content is an anchor into a button and uses
-- THE ANCHOR'S OWN WORDS as the label, which is how inquiry_staff_alert gets
-- its button. So Jimmy's two labels arrive exactly as he wrote them, without
-- a merge field or a BUTTON_LABELS entry existing for either.
--
-- ── WHAT IS WRITTEN AS HE WROTE IT, INCLUDING THE PARTS I WOULD NOT HAVE ────
--
--   "Structure Literacy" in the sentence, "Structured Literacy" on the button.
--   Both are his, from the same two messages, and they disagree. Reproduced
--   rather than reconciled: the wording of a letter a parent reads is his.
--
--   "Heather will reach out to you" names her rather than using
--   {{admissions_contact_name}}. His sentence. It is correct today and it is
--   the one line in this letter that would need changing if Virtual ever has
--   a different admissions contact - the sign-off below it already uses the
--   merge field and would follow by itself.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_net integer;
  n_vir integer;
begin
  select count(*) into n_net
  from public.admissions_communication_templates
  where template_key = 'application_submitted_email' and school_id is null;
  if n_net <> 1 then
    raise exception 'Refusing: expected 1 network row for application_submitted_email, found %.', n_net;
  end if;

  select count(*) into n_vir
  from public.admissions_communication_templates
  where template_key = 'application_submitted_email'
    and school_id = 'a1000000-0000-4000-8000-000000000004';
  if n_vir <> 0 then
    raise exception 'Refusing: Virtual already has its own row. This has run.';
  end if;
end $$;

-- ── THE ROW ────────────────────────────────────────────────────────────────
--
-- INSERT ... SELECT from the network row so channel, trigger_event,
-- delay_hours, is_active and category are inherited rather than retyped. Only
-- the campus and the words differ, which is the whole point of a campus row.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, version_number, description)
select
  'a1000000-0000-4000-8000-000000000004',
  t.template_key,
  t.name,
  t.channel,
  t.trigger_event,
  t.subject,
  '<p>Dear {{guardian_first_name}},</p>'
  || '<p>Thank you for submitting {{student_first_name}}''s application for admission to our school.</p>'
  || '<p><strong>The next step in the process is to click on the 2 links below to schedule '
  || '{{student_first_name}}''s Math and Structure Literacy Assessments. After these have been '
  || 'completed, Heather will reach out to you with next steps.</strong></p>'
  || '<p><a href="https://calendar.google.com/calendar/u/0/appointments/schedules/'
  || 'AcZssZ3Mi_h1zyHtNu7qiXZxiQTHTjRBwGPhhIj6gfCO6O7uoguaEJzvvf7atar7Gz5gvbKAvfBh9Cvg">'
  || 'Schedule Math Assessment w/ Ms. Raven</a></p>'
  || '<p><a href="https://calendar.google.com/calendar/u/0/appointments/schedules/'
  || 'AcZssZ2gIPykl7DWmwk0ywB7L3a5N25i2wmKsFzt76jpI0vqub_qXmkip8zOsn2Sxbti7Ot90jDjAkHT">'
  || 'Schedule Structured Literacy Assessment w/ Ms. Holly</a></p>'
  || '<p>If you have questions at any point, reply to this email and it will reach me directly.</p>'
  || '<p>Warm regards,<br>{{admissions_contact_name}}<br>{{school_name}} Admissions</p>',
  t.delay_hours,
  t.is_active,
  t.category,
  1,
  'The Academy Virtual only. Carries the two assessment booking links - Math with Ms. Raven, Structured Literacy with Ms. Holly - because at Virtual the assessments are the step between the application and the shadow day. Jimmy, 16 October 2026.'
from public.admissions_communication_templates t
where t.template_key = 'application_submitted_email' and t.school_id is null;

-- ── THE GUARDS, AFTER ──────────────────────────────────────────────────────

do $$
declare
  v record;
  n record;
begin
  select * into v from public.admissions_communication_templates
  where template_key = 'application_submitted_email'
    and school_id = 'a1000000-0000-4000-8000-000000000004';
  if v is null then raise exception 'Refusing: the Virtual row was not written.'; end if;

  -- HIS SENTENCE, WORD FOR WORD.
  if v.body not like '%The next step in the process is to click on the 2 links below to schedule {{student_first_name}}''s Math and Structure Literacy Assessments. After these have been completed, Heather will reach out to you with next steps.%' then
    raise exception 'Refusing: his sentence is not in the letter exactly as he wrote it.';
  end if;

  -- BOTH LINKS, AND BOTH AS A PARAGRAPH THAT IS NOTHING BUT AN ANCHOR, which
  -- is the shape letter-html turns into a button.
  if v.body not like '%<p><a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3Mi%">Schedule Math Assessment w/ Ms. Raven</a></p>%' then
    raise exception 'Refusing: the Math button is not a sole-anchor paragraph.';
  end if;
  if v.body not like '%<p><a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2g%">Schedule Structured Literacy Assessment w/ Ms. Holly</a></p>%' then
    raise exception 'Refusing: the Structured Literacy button is not a sole-anchor paragraph.';
  end if;

  -- THE TWO SENTENCES THAT CONTRADICT HIM MUST NOT BE IN THE VIRTUAL ROW.
  if v.body like '%nothing else for you to do%' or v.body like '%scheduling your Shadow Days%' then
    raise exception 'Refusing: a sentence telling the parent there is nothing to do survived.';
  end if;

  -- AND THE NETWORK ROW MUST BE EXACTLY AS IT WAS, for GA and FL.
  select * into n from public.admissions_communication_templates
  where template_key = 'application_submitted_email' and school_id is null;
  if n.body not like '%There is nothing else for you to do in the meantime.%'
     or n.body not like '%which normally involves scheduling your Shadow Days%'
     or n.body like '%Assessment%' then
    raise exception 'Refusing: the network row was changed. GA and FL read that one.';
  end if;

  -- NO OTHER CAMPUS GAINED A ROW.
  if (select count(*) from public.admissions_communication_templates
      where template_key = 'application_submitted_email') <> 2 then
    raise exception 'Refusing: application_submitted_email should now be exactly 2 rows.';
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select coalesce(s.name, 'NETWORK ROW') as campus, t.is_active, t.trigger_event, t.subject, t.body
from public.admissions_communication_templates t
left join public.schools s on s.id = t.school_id
where t.template_key = 'application_submitted_email'
order by s.name nulls first;
