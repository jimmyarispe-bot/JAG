-- 486_disarm_the_three_incomplete_letters_2026_10_04.sql
--
-- Switches application_incomplete_3d, _7d and _14d OFF. Nothing else.
--
-- WHAT THE CHECK FOUND, 4 October 2026, verbatim from the result:
--
--   1  template       application_incomplete_3d    ON              delay 72h · email
--   1  template       application_incomplete_7d    ON              delay 168h · email
--   1  template       application_incomplete_14d   ON              delay 336h · email
--   2  workflow       wf_application_started       *** ACTIVE ***  application_started
--   3  workflow step  step 2 · trigger_communications  *** WIRED AND ACTIVE ***
--
-- Sections 4 and 5 returned nothing: none queued, and not one has ever been
-- sent to a family.
--
-- SO THIS IS A LANDMINE, NOT A LIVE PROBLEM - AND IT IS ARMED.
--
-- Three letters are on. A live workflow is wired to fire them. The only
-- reason no family has received one is that nothing has yet fired
-- application_started down that path. The moment something does, all three
-- queue at once:
--
--   1. NOTHING CANCELS THE LATER TWO. scheduleApplicationIncompleteReminders
--      queues all three at the moment an application starts. A family who
--      submits on day four is still chased on day seven and day fourteen.
--      The module that replaced it says so in its own header.
--
--   2. EVERY ONE OF THEM ENDS IN A PASSWORD BOX. {{portal_link}} renders
--      /apply/portal/<application id>, and that route calls
--      redirect("/login?next=/apply/portal") for anyone not signed in.
--      Families have no account.
--
--   3. THEY WOULD RUN BESIDE THE NEW 4c CLOCK. parent-reminders.ts now chases
--      the same families at 24, 72 and 96 hours and stops when they submit.
--      Two machines, two clocks, one family.
--
-- WHY OFF RATHER THAN DELETED. Deleting loses the words, and the words are
-- not the problem - the mechanism is. Off is reversible by one person in the
-- template screen; deleted is a migration. Nothing reads an inactive
-- template: enqueue and triggerCommunications both filter on is_active.
--
-- THE WORKFLOW STEP IS LEFT ALONE. It also fires application_started_email
-- and the state-funding check, both of which are wanted. Switching the three
-- letters off disarms the reminders without touching anything else in that
-- step - which is exactly why this is a template change and not a code one.
--
-- Safe to re-run: the guard means a second run matches nothing.

begin;

update public.admissions_communication_templates
   set is_active = false,
       updated_at = now()
 where template_key in ('application_incomplete_3d',
                        'application_incomplete_7d',
                        'application_incomplete_14d')
   and is_active;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT four rows: the three letters, every one reading 'off', and a COUNT
-- row reading 0.
--
-- The count row is there on purpose. A verify that proves success by
-- returning no rows cannot tell "it worked" from "the query was wrong", and
-- this platform has been bitten by that difference more than once.
--
-- If a campus holds its own copy of one of these, it appears as its own row
-- and this switched it off too - which is correct, and worth seeing.

select 'letter'                                              as what,
       coalesce(sc.name, 'every campus')                     as applies_to,
       t.template_key                                        as detail,
       case when t.is_active then '*** STILL ON ***' else 'off' end as state,
       'delay ' || t.delay_hours || 'h'                      as extra

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in ('application_incomplete_3d',
                          'application_incomplete_7d',
                          'application_incomplete_14d')

union all

select 'COUNT still armed',
       '',
       count(*)::text,
       case when count(*) = 0
            then 'disarmed — nothing can queue them'
            else '*** ONE IS STILL ON ***' end,
       ''
  from public.admissions_communication_templates t
 where t.template_key in ('application_incomplete_3d',
                          'application_incomplete_7d',
                          'application_incomplete_14d')
   and t.is_active

 order by what, applies_to, detail;
