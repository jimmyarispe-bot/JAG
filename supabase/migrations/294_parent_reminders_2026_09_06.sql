-- 294_parent_reminders_2026_09_06.sql
--
-- The 48-hour parent reminder.
--
-- WHAT THIS IS FOR. When a family is waiting on US, the pending-decisions page
-- shows it. When WE are waiting on the FAMILY, nothing happens at all -- the lead
-- sits at a stage until somebody notices. 289 leads, 111 of them parked in
-- information_sent. This is the machinery that chases.
--
-- WHY NOT ON THE DECISION GATES. admissions_decision_gates already has
-- notify_count and notified_at, which look like exactly the right fields. They
-- are not: all three gates (invite_to_apply, invite_to_shadow_days,
-- accept_or_deny) ask a SCHOOL LEADER a question. None of them is waiting on a
-- parent. Reusing them would have chased you, not the family.
--
-- WHY NOT ON scheduleApplicationIncompleteReminders. It exists, in
-- communications/engine.ts, and it fires all three reminders in one
-- Promise.all at the moment the application starts. Nothing cancels the day-7
-- and day-14 messages if the parent finishes on day 4 -- they are already in the
-- queue. This table instead holds STATE, and the nightly job re-reads the world
-- each time: if the family has done the thing, it stops. Nothing is ever
-- pre-scheduled.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

-- ---------------------------------------------------------------------------
-- 1. The four things a parent can be waited on for.
--    Stored as text with a CHECK rather than an enum so adding a fifth is one
--    migration, not an enum rewrite.
-- ---------------------------------------------------------------------------

create table if not exists public.admissions_parent_reminders (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null
                     references public.admissions_leads(id) on delete cascade,
  wait_key         text not null,
  -- When we started waiting. The 48-hour clock runs from here for the first
  -- reminder, and from last_reminded_at for each one after.
  waiting_since    timestamptz not null default now(),
  reminders_sent   integer not null default 0,
  last_reminded_at timestamptz,
  -- Set when the parent finally does the thing. The row is kept, not deleted:
  -- "how long did this family take, and how many nudges" is the question this
  -- table exists to be able to answer later.
  resolved_at      timestamptz,
  resolution       text,
  -- Set when the third reminder has gone unanswered and the school leader has
  -- been emailed the family's details.
  escalated_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint admissions_parent_reminders_one_open_per_wait
    unique (lead_id, wait_key),
  constraint admissions_parent_reminders_wait_valid
    check (wait_key in (
      'application_not_started',   -- invited to apply, nothing started
      'application_not_submitted', -- started, never submitted
      'shadow_days_not_scheduled', -- invited to shadow days, none booked
      'enrollment_not_completed'   -- accepted, packet not finished
    )),
  constraint admissions_parent_reminders_count_sane
    check (reminders_sent between 0 and 3),
  constraint admissions_parent_reminders_resolution_valid
    check (resolution is null or resolution in ('completed', 'stage_moved', 'archived')),
  -- A reminder that has been sent must have a time on it. Otherwise "how long
  -- since we last chased them" silently becomes unanswerable.
  constraint admissions_parent_reminders_sent_coherent
    check ((reminders_sent = 0) = (last_reminded_at is null))
);

comment on table public.admissions_parent_reminders is
  'One row per (lead, thing we are waiting on the parent for). The nightly job '
  're-evaluates the real world each run and sends at most one reminder per row '
  'per run. Nothing is pre-scheduled, so a parent who finishes on day 4 never '
  'receives the day-6 chase.';
comment on column public.admissions_parent_reminders.resolved_at is
  'Kept rather than deleted. This is the only place that will ever be able to '
  'answer "how many nudges does an application actually take".';

create index if not exists admissions_parent_reminders_open_idx
  on public.admissions_parent_reminders (wait_key, last_reminded_at)
  where resolved_at is null and escalated_at is null;
create index if not exists admissions_parent_reminders_lead_idx
  on public.admissions_parent_reminders (lead_id);

-- ---------------------------------------------------------------------------
-- 2. RLS. Same inheritance trick as 293: you can see a reminder if you can see
--    its lead. No write policies -- the nightly job runs as service role.
-- ---------------------------------------------------------------------------

alter table public.admissions_parent_reminders enable row level security;

drop policy if exists admissions_parent_reminders_read on public.admissions_parent_reminders;
create policy admissions_parent_reminders_read
  on public.admissions_parent_reminders
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admissions_leads l
       where l.id = admissions_parent_reminders.lead_id
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Email templates -- one reminder per wait, plus one leader escalation.
--
--    Seeded PER SCHOOL, because admissions_communication_templates is scoped by
--    school_id and a template that exists for one school is invisible to the
--    others. This is the failure mode that made staff_application_submitted
--    look broken: the row existed, just not where the lead was.
--
--    delay_hours is 0 on all of them. The delay is decided by the job, from
--    real state -- not baked into the template where it cannot be reconsidered.
-- ---------------------------------------------------------------------------

-- EVERY BODY IS ONE E'...' LITERAL ON ONE LINE.
-- The first version of this file split each body across several literals, the
-- first with an E prefix and the rest without. Two problems, one of which
-- Postgres caught and one of which it would not have:
--   * a plain '...' literal cannot be continued by an E'...' one -- syntax error
--   * and the \n inside a NON-E literal is a literal backslash-n, so the emails
--     that did parse would have been sent with "\n" printed in them.
-- E applies per literal, not to the continuation. One literal each, no splits.

do $$
declare
  sch    record;
  t      record;
  seeded integer := 0;
begin
  for sch in select id, name from public.schools loop
    for t in
      select * from (values
        ('parent_reminder_application_not_started',
         'Reminder: start your application',
         'A quick reminder about your application to {{school_name}}',
         E'Hi {{guardian_first_name}},\n\nWe invited {{student_first_name}} to apply to {{school_name}} and have not seen an application come through yet.\n\nIf you are still interested, you can start here: {{application_link}}\n\nIf something has changed, or you have a question, just reply to this email and a person will answer.\n\n{{school_name}}'),
        ('parent_reminder_application_not_submitted',
         'Reminder: finish your application',
         'Your application to {{school_name}} is nearly done',
         E'Hi {{guardian_first_name}},\n\nThank you for starting {{student_first_name}}''s application to {{school_name}}. It has not been submitted yet.\n\nYou can pick up where you left off here: {{application_link}}\n\nIf you are stuck on a document or a question, reply to this email and we will help.\n\n{{school_name}}'),
        ('parent_reminder_shadow_days_not_scheduled',
         'Reminder: book your shadow days',
         'Booking {{student_first_name}}''s shadow days at {{school_name}}',
         E'Hi {{guardian_first_name}},\n\nWe invited {{student_first_name}} to spend shadow days with us at {{school_name}} and have not got dates in the diary yet.\n\nYou can book here: {{shadow_days_link}}\n\nIf none of the dates work, reply and we will find some that do.\n\n{{school_name}}'),
        ('parent_reminder_enrollment_not_completed',
         'Reminder: complete your enrollment',
         'One step left to enroll {{student_first_name}}',
         E'Hi {{guardian_first_name}},\n\nCongratulations again on {{student_first_name}}''s place at {{school_name}}.\n\nYour enrollment paperwork is not finished yet, and the place is not final until it is: {{enrollment_link}}\n\nIf anything is unclear, reply to this email and we will walk you through it.\n\n{{school_name}}')
      ) as v(k, n, subj, body)
    loop
      insert into public.admissions_communication_templates
        (school_id, template_key, name, channel, trigger_event, subject, body,
         delay_hours, is_active, category)
      select sch.id, t.k, t.n, 'email', 'additional_info_requested', t.subj, t.body,
             0, true, 'admissions'
      where not exists (
        select 1 from public.admissions_communication_templates x
         where x.school_id = sch.id and x.template_key = t.k
      );
      if found then seeded := seeded + 1; end if;
    end loop;

    -- The escalation. Goes to the school, not the family, and carries the
    -- contact details so whoever reads it can pick up the phone without going
    -- to look them up.
    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    select sch.id, 'staff_parent_unresponsive',
           'Escalation: parent has not responded to three reminders',
           'email', 'staff_portal_message',
           'No response after three reminders - {{student_name}}',
           E'{{student_name}} at {{school_name}} has not responded to three reminders about: {{wait_description}}.\n\nWe first started waiting on {{waiting_since}}. Reminders were sent on {{reminder_dates}}.\n\nParent: {{guardian_name}}\nEmail: {{guardian_email}}\nPhone: {{guardian_phone}}\n\nAutomated reminders have stopped for this family. Someone should call them, or mark the lead as not proceeding.\n\n{{lead_link}}',
           0, true, 'admissions'
    where not exists (
      select 1 from public.admissions_communication_templates x
       where x.school_id = sch.id and x.template_key = 'staff_parent_unresponsive'
    );
    if found then seeded := seeded + 1; end if;
  end loop;

  if seeded = 0 then
    raise notice 'No templates seeded -- all five already existed at every school.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Report
-- ---------------------------------------------------------------------------

drop table if exists _parent_reminder_report;
create temp table _parent_reminder_report (seq integer, item text, value text);

do $$
declare
  v_schools   integer;
  v_templates integer;
  v_contacts  integer;
  v_missing   integer;
  v_leads     integer;
begin
  select count(*) into v_schools from public.schools;
  select count(*) into v_templates
    from public.admissions_communication_templates
   where template_key like 'parent_reminder_%' or template_key = 'staff_parent_unresponsive';
  select count(*) into v_leads from public.admissions_leads;

  -- The escalation is useless if the school has nobody to send it to.
  select count(*) filter (where admissions_contact_email is not null
                            and admissions_contact_email <> ''),
         count(*) filter (where admissions_contact_email is null
                             or admissions_contact_email = '')
    into v_contacts, v_missing
    from public.schools;

  insert into _parent_reminder_report values
    (1, 'Table created',            'admissions_parent_reminders'),
    (2, 'Waits tracked',            'application_not_started, application_not_submitted, shadow_days_not_scheduled, enrollment_not_completed'),
    (3, 'Cadence',                  '48h, then 48h, then 48h, then escalate to the school'),
    (4, 'Schools',                  v_schools::text),
    (5, 'Reminder templates now present (expect schools x 5)', v_templates::text),
    (6, 'Schools WITH an admissions contact email', v_contacts::text),
    (7, 'Schools WITHOUT one (escalation would go nowhere)', v_missing::text),
    (8, 'Leads in the pipeline', v_leads::text),
    (9, 'Rows created by this migration', '0 - the job creates them, see below');
end $$;

commit;

select item, value from _parent_reminder_report order by seq;

-- ---------------------------------------------------------------------------
-- THIS MIGRATION SENDS NOTHING AND CREATES NO REMINDER ROWS.
--
-- It builds the table and the templates. The nightly job
-- (processParentReminders, registered in processAllPlatformQueues) opens rows
-- when it first sees a family being waited on, and closes them when the family
-- acts.
--
-- ON THE FIRST RUN. Every lead already sitting in one of these four states gets
-- a row with waiting_since = now(), NOT their real stage date. That is
-- deliberate: 111 families have been parked in information_sent for months, and
-- backdating would fire three reminders and an escalation at all of them on the
-- first night. They start the clock today.
--
-- WHAT STILL NEEDS A HUMAN: the {{application_link}}, {{shadow_days_link}} and
-- {{enrollment_link}} placeholders resolve to the family portal. Check the
-- rendered text of one email before this runs against real families.
-- ---------------------------------------------------------------------------
