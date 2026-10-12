-- ============================================================================
-- 538  A CAMPUS ONLY JIMMY CAN SEE
--      12 October 2026
-- ============================================================================
--
-- WHY THIS EXISTS, IN JIMMY'S WORDS
--
--   "i want to create a universal account/login/system that i can use to test
--    everything a school leader sees, receives, does, etc. waiting on them and
--    having to work with them to workout the kinks in the jag is not practical
--    and very timeconsuming. i want to be able to do this myself."
--
-- Every end-to-end test so far has been run through a REAL campus, which means
-- a real school leader's inbox, a real family's pipeline, and a real set of
-- rows that then have to be archived afterwards. Three of those tests this
-- month ended with Danni receiving letters about children who do not exist.
--
-- This migration builds a FIFTH campus that exists only to be tested through.
-- It is a faithful copy of The Academy FL - the same letters, the same
-- programs, the same checklist, tours switched on - with exactly one difference
-- that matters: every email it sends goes to test.leader@theacademyway.org,
-- which is Jimmy's own account. No real family and no real school leader is
-- ever touched by it.
--
-- ── WHAT IS COPIED FROM THE ACADEMY FL, AND WHY FL AND NOT GA ───────────────
--
-- FL is the phone-conversation sequence - "interest conversation" rather than
-- "virtual interest meeting" - and it is the campus whose path has the tour
-- step in it. Copying FL means the test walks the longest road the JAG has:
-- inquiry, send the link, scheduled, held, record your notes, tour invitation,
-- tour, application, shadow days.
--
-- Copied: the 16 school-specific letter templates (bodies untouched - they are
-- all merge fields, no campus name is written into any of them), the 6 program
-- rows, the 14 checklist items, the admissions settings row.
--
-- NOT copied: square_location_id. FL's is a real Square location and a second
-- campus pointing at it would put test money through a real till. Left null.
--
-- ── THE FOUR CALENDAR LINKS ─────────────────────────────────────────────────
--
-- Jimmy created these on test.leader@theacademyway.org on 11 October:
--
--   interest call            https://calendar.app.google/Q1EfhsTx4bjpQKgY9
--   tour                     https://calendar.app.google/Tu9jJcXBphMiozqE9
--   shadow days              https://calendar.app.google/Fo1HwPADcU5ZydpR6
--   virtual interest meeting https://calendar.app.google/9CoXdzXxJwknobcp8
--
-- The first three go into the three columns below. The fourth has no column -
-- `schools` has one admissions_booking_url and FL's sequence is the phone
-- conversation, so the interest call link takes it. The virtual link is held
-- spare for the day this campus is used to test the HS/Virtual wording.
--
-- ── WHAT THIS MIGRATION DOES NOT DO ────────────────────────────────────────
--
-- 1. It does not touch the published interest form (version 39). That form's
--    inquiry-phase Program question filters its options by school id, so on
--    /apply this campus will offer only "Only Virtual" until a rule naming it
--    is added, and the FL-specific application sections will not appear for it.
--    Editing a form 146 real families have used is not something to slip into
--    a test-campus migration. It is a separate, explicit change.
--
-- 2. It does not share test.leader@'s calendar with
--    jimmy.arispe@theacademyway.org. The booking scan reads only the calendars
--    in THAT account's calendarList, so until the share is accepted the scan
--    will report this campus under `campusesWithNoCalendar`. That is a Google
--    setting, not a database one.
--
-- ── NAMES CHOSEN HERE, AND HOW TO CHANGE THEM ──────────────────────────────
--
-- The campus name is Jimmy's, verbatim: 'XXXXXXXX Test Campus'.
--
-- The admissions contact NAME is not - a letter has to be signed by somebody,
-- so this picks 'Taylor Reed'. To change it, two updates at the bottom of this
-- file, both commented out, are ready to run.
--
-- ============================================================================

begin;

-- ── 1. THE CAMPUS ──────────────────────────────────────────────────────────
--
-- The id follows the convention the other four set: a1000000-...-00000000000N.
-- Fifth campus, fifth id. The constant id is what makes every insert below
-- re-runnable and what lets a human read a row and know which campus it is.

insert into public.schools (
  id,
  name,
  address,
  timezone,
  organization_id,
  region_id,
  admissions_interest_public,
  admissions_contact_name,
  admissions_contact_email,
  admissions_booking_url,
  admissions_from_email,
  shadow_days_url,
  tour_booking_url,
  meets_virtually,
  square_location_id,
  school_leader_bcc_email
) values (
  'a1000000-0000-4000-8000-000000000005',
  'XXXXXXXX Test Campus',
  '123 Test Street, Port Saint Lucie, Florida 34983 - testing only, no family is ever sent here',
  'America/New_York',
  '5ea08717-765a-4ec0-953d-9fdac619f1a1',
  null,
  true,
  'Taylor Reed',
  'test.leader@theacademyway.org',
  'https://calendar.app.google/Q1EfhsTx4bjpQKgY9',
  -- from_email left null, exactly as The Academy FL has it, so the letters go
  -- out on the same From address FL's do. One fewer difference between the
  -- test and the thing being tested.
  null,
  'https://calendar.app.google/Fo1HwPADcU5ZydpR6',
  'https://calendar.app.google/Tu9jJcXBphMiozqE9',
  false,
  null,
  'test.leader@theacademyway.org'
)
on conflict (id) do update set
  name                       = excluded.name,
  address                    = excluded.address,
  timezone                   = excluded.timezone,
  organization_id            = excluded.organization_id,
  admissions_interest_public = excluded.admissions_interest_public,
  admissions_contact_name    = excluded.admissions_contact_name,
  admissions_contact_email   = excluded.admissions_contact_email,
  admissions_booking_url     = excluded.admissions_booking_url,
  shadow_days_url            = excluded.shadow_days_url,
  tour_booking_url           = excluded.tour_booking_url,
  meets_virtually            = excluded.meets_virtually,
  school_leader_bcc_email    = excluded.school_leader_bcc_email,
  updated_at                 = now();

-- ── 2. THE CAMPUS ROW UNDER THE SCHOOL ─────────────────────────────────────
--
-- `admissions_tours.campus_id` points at `campuses`, not at `schools`. Without
-- a row here a tour cannot be recorded against this campus at all, and the
-- tour half of the test would fail with a foreign key error nobody would
-- connect to a missing row.
--
-- One row, primary, where FL has two (campus and virtual). This campus is
-- never going to run two programs side by side.

insert into public.campuses (id, school_id, name, code, address, timezone, is_primary, status)
values (
  'c1000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000005',
  'XXXXXXXX Test Campus',
  'TEST-CAMPUS',
  '123 Test Street, Port Saint Lucie, Florida 34983 - testing only, no family is ever sent here',
  'America/New_York',
  true,
  'active'
)
on conflict (id) do update set
  school_id  = excluded.school_id,
  name       = excluded.name,
  code       = excluded.code,
  address    = excluded.address,
  is_primary = excluded.is_primary,
  status     = excluded.status,
  updated_at = now();

-- ── 3. THE PROGRAMS ────────────────────────────────────────────────────────
--
-- `list_programs_for_public_inquiry` reads org_programs for the chosen school.
-- Every campus carries the same six rows - the whole network's list - so this
-- copies FL's six verbatim rather than inventing a shorter list that would
-- make the test campus behave unlike the four real ones.

insert into public.org_programs (school_id, name, code, description, status, settings)
select
  'a1000000-0000-4000-8000-000000000005',
  p.name,
  p.code,
  p.description,
  p.status,
  p.settings
from public.org_programs p
where p.school_id = 'a1000000-0000-4000-8000-000000000001'
  and not exists (
    select 1 from public.org_programs x
    where x.school_id = 'a1000000-0000-4000-8000-000000000005'
      and x.code = p.code
  );

-- ── 4. THE ADMISSIONS SETTINGS ROW ─────────────────────────────────────────

insert into public.school_admissions_settings (school_id, enrollment_goal, marketing_spend_annual)
select
  'a1000000-0000-4000-8000-000000000005',
  s.enrollment_goal,
  s.marketing_spend_annual
from public.school_admissions_settings s
where s.school_id = 'a1000000-0000-4000-8000-000000000001'
  and not exists (
    select 1 from public.school_admissions_settings x
    where x.school_id = 'a1000000-0000-4000-8000-000000000005'
  );

-- ── 5. THE CHECKLIST ───────────────────────────────────────────────────────

insert into public.admissions_checklist_template_items
  (school_id, item_key, label, description, category, is_required, sort_order, is_active)
select
  'a1000000-0000-4000-8000-000000000005',
  i.item_key,
  i.label,
  i.description,
  i.category,
  i.is_required,
  i.sort_order,
  i.is_active
from public.admissions_checklist_template_items i
where i.school_id = 'a1000000-0000-4000-8000-000000000001'
  and not exists (
    select 1 from public.admissions_checklist_template_items x
    where x.school_id = 'a1000000-0000-4000-8000-000000000005'
      and x.item_key = i.item_key
  );

-- ── 6. THE SIXTEEN LETTERS ─────────────────────────────────────────────────
--
-- THIS IS THE PART THAT MAKES THE TEST WORTH RUNNING.
--
-- There are 43 org-level templates (school_id null) that every campus
-- inherits, and 16 FL-specific ones that OVERRIDE them. engine.ts sorts
-- null-school templates first and school-specific last, so the school's own
-- row wins. Those 16 are where FL's wording lives: "interest conversation"
-- rather than "virtual interest meeting", the T1 tour invitation, the shadow
-- days invitation, and the four staff escalations.
--
-- Without this block the test campus would quietly inherit the generic
-- org-level wording and the test would prove nothing about what Danni reads.
--
-- Bodies and subjects are copied BYTE FOR BYTE. All 16 were checked first:
-- not one of them writes "The Academy FL", "Florida" or an address into its
-- text - every campus-specific word in them is a merge field. Only the
-- human-facing `name` is rewritten, so the two rows can be told apart in the
-- templates list.

insert into public.admissions_communication_templates
  (school_id, template_key, name, channel, trigger_event, subject, body,
   delay_hours, is_active, category, version_number, description)
select
  'a1000000-0000-4000-8000-000000000005',
  t.template_key,
  replace(t.name, '(The Academy FL)', '(XXXXXXXX Test Campus)'),
  t.channel,
  t.trigger_event,
  t.subject,
  t.body,
  t.delay_hours,
  t.is_active,
  t.category,
  t.version_number,
  t.description
from public.admissions_communication_templates t
where t.school_id = 'a1000000-0000-4000-8000-000000000001'
  and not exists (
    select 1 from public.admissions_communication_templates x
    where x.school_id = 'a1000000-0000-4000-8000-000000000005'
      and x.template_key = t.template_key
  );

-- ── 7. WHO GETS THE MAIL ───────────────────────────────────────────────────
--
-- `school_admissions_contacts` is the table that decides which inbox a staff
-- letter lands in. It is keyed by email with user_id left null, which is how
-- Danni's, Nina's and Heather's rows are written.
--
-- is_booking_contact = true ON THIS CAMPUS ONLY. That flag is what makes a
-- leader the person the booking links and the "RECORD your notes" prompts are
-- addressed to. Setting it anywhere else would divert a real family's mail.

insert into public.school_admissions_contacts
  (school_id, user_id, name, email, phone, receives_notifications, is_booking_contact, booking_url, is_active)
values
  ('a1000000-0000-4000-8000-000000000005', null, 'Taylor Reed',
   'test.leader@theacademyway.org', null, true, true,
   'https://calendar.app.google/Q1EfhsTx4bjpQKgY9', true),
  -- Jimmy sits on all four real campuses as a notified, non-booking contact.
  -- The fifth is no different: he should see the staff alerts this campus
  -- raises without the booking links being addressed to him.
  ('a1000000-0000-4000-8000-000000000005', null, 'Jimmy Arispe',
   'jimmy.arispe@theacademyway.org', null, true, false, null, true)
on conflict do nothing;

-- ── 8. WHO CAN SEE IT IN THE JAG ───────────────────────────────────────────
--
-- Access is written per school, twice: `user_schools` and
-- `user_org_assignments`. Both are needed - one is the membership, the other
-- is the scope the dashboard reads.
--
-- BOTH ACCOUNTS NEED A ROW. test.leader@ obviously; but Jimmy's founder
-- account carries four explicit rows rather than a wildcard, so without a
-- fifth he would not see his own test campus.

insert into public.user_schools (user_id, school_id)
select u.id, 'a1000000-0000-4000-8000-000000000005'
from auth.users u
where u.email in ('test.leader@theacademyway.org', 'jimmy.arispe@theacademyway.org')
  and not exists (
    select 1 from public.user_schools x
    where x.user_id = u.id
      and x.school_id = 'a1000000-0000-4000-8000-000000000005'
  );

insert into public.user_org_assignments
  (user_id, school_id, campus_id, program_id, department_id, all_campuses, all_programs, is_primary)
select u.id, 'a1000000-0000-4000-8000-000000000005', null, null, null, true, true, false
from auth.users u
where u.email in ('test.leader@theacademyway.org', 'jimmy.arispe@theacademyway.org')
  and not exists (
    select 1 from public.user_org_assignments x
    where x.user_id = u.id
      and x.school_id = 'a1000000-0000-4000-8000-000000000005'
  );

commit;

-- ============================================================================
-- VERIFICATION - run this after the migration and read every number.
-- Expected: 1 school, 1 campus, 6 programs, 1 settings row, 14 checklist
-- items, 16 templates, 2 contacts (1 booking), 2 user_schools, 2 assignments.
-- ============================================================================

select 'school'            as what, count(*)::text as n from public.schools                             where id       = 'a1000000-0000-4000-8000-000000000005'
union all select 'campus',          count(*)::text      from public.campuses                            where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'programs',        count(*)::text      from public.org_programs                        where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'settings',        count(*)::text      from public.school_admissions_settings          where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'checklist items', count(*)::text      from public.admissions_checklist_template_items where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'templates',       count(*)::text      from public.admissions_communication_templates  where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'contacts',        count(*)::text      from public.school_admissions_contacts          where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'booking contact', count(*)::text      from public.school_admissions_contacts          where school_id = 'a1000000-0000-4000-8000-000000000005' and is_booking_contact
union all select 'user_schools',    count(*)::text      from public.user_schools                        where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'assignments',     count(*)::text      from public.user_org_assignments                where school_id = 'a1000000-0000-4000-8000-000000000005'
union all select 'on /apply',       string_agg(name, ', ' order by name) from public.list_schools_for_public_inquiry('5ea08717-765a-4ec0-953d-9fdac619f1a1');

-- The three links, read back as a parent's letter would merge them.
select name, admissions_booking_url, tour_booking_url, shadow_days_url, school_leader_bcc_email
from public.schools
where id = 'a1000000-0000-4000-8000-000000000005';

-- Every letter this campus will send in its own wording, FL's row beside it.
select t.trigger_event, t.template_key, t.name, t.is_active, t.channel
from public.admissions_communication_templates t
where t.school_id = 'a1000000-0000-4000-8000-000000000005'
order by t.trigger_event;

-- ============================================================================
-- TO CHANGE THE CONTACT NAME - uncomment both, replace Taylor Reed, run.
-- ============================================================================
-- update public.schools
--    set admissions_contact_name = 'Taylor Reed', updated_at = now()
--  where id = 'a1000000-0000-4000-8000-000000000005';
--
-- update public.school_admissions_contacts
--    set name = 'Taylor Reed', updated_at = now()
--  where school_id = 'a1000000-0000-4000-8000-000000000005'
--    and email = 'test.leader@theacademyway.org';
