-- 489_the_interest_meeting_link_becomes_a_decision_2026_10_04.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED. It puts {{interest_link_action}}
-- into a live letter and that merge field does not exist until this ship
-- lands. renderTemplate leaves an unknown token in place as literal text.
--
-- Jimmy, 4 October 2026: "1b needs to have a decision by the school leader to
-- send the interest meeting link and reminded to send each 24hours if they
-- don't send it. this is the only option here."
--
-- Asked what the family hears in the meantime: "Nothing until she sends".
-- Asked how long the reminders run: "2 then tells me n danni".
--
-- ─────────────────────────────────────────────────────────────────────────────
-- THE BIG CHANGE IS ONE COLUMN ON TWO ROWS.
--
-- inquiry_thank_you_email and inquiry_thank_you_email_no_link move off
-- trigger_event 'inquiry_submitted' and onto 'interest_meeting_link_sent'.
-- Nothing fires that event except the new page, so from the moment this runs
-- A FAMILY WHO INQUIRES RECEIVES NOTHING until a school leader presses send.
--
-- Both letters are otherwise untouched. The guard in the engine that picks
-- the version with the booking link over the version without still works
-- exactly as it did - it chooses between the two templates for the event,
-- whatever the event is called.
--
-- WHAT STILL FIRES ON inquiry_submitted. inquiry_staff_alert, which is the
-- notice that now carries the button, and inquiry_portal_notification, which
-- sits on a channel the engine never sends. So the staff still hear about
-- every inquiry within seconds. Only the family waits.
--
-- Safe to re-run: every step is guarded.

begin;

-- ── 1. The token ─────────────────────────────────────────────────────────────

alter table public.admissions_leads
  add column if not exists interest_link_token text;

create unique index if not exists idx_admissions_leads_interest_link_token
  on public.admissions_leads(interest_link_token)
  where interest_link_token is not null;

comment on column public.admissions_leads.interest_link_token is
  'Minted when a public inquiry is created. Opens /send-interest-link/<token>, '
  'the one-button page where a school leader sends the family their booking '
  'link. Nothing else sends the family their first letter.';

-- ── 2. The new wait ──────────────────────────────────────────────────────────
--
-- The check constraint was written inline in migration 294, so Postgres named
-- it. It is looked up rather than assumed: a hard-coded name that does not
-- exist makes the drop a no-op and the add a duplicate, and the failure would
-- not show until the job tried to open its first row.

do $$
declare
  v_name text;
begin
  select con.conname into v_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'admissions_parent_reminders'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%application_not_started%';

  if v_name is null then
    raise notice 'No wait_key check constraint found - nothing to replace.';
  else
    execute format(
      'alter table public.admissions_parent_reminders drop constraint %I', v_name
    );
  end if;

  alter table public.admissions_parent_reminders
    add constraint admissions_parent_reminders_wait_valid
    check (wait_key in (
      -- The only wait where we are waiting on US.
      'interest_link_not_sent',
      'application_not_started',
      'application_not_submitted',
      'shadow_days_not_scheduled',
      'enrollment_not_completed'
    ));
end $$;

-- ── 3. The family's first letter stops being automatic ───────────────────────

update public.admissions_communication_templates
   set trigger_event = 'interest_meeting_link_sent',
       updated_at = now()
 where template_key in ('inquiry_thank_you_email', 'inquiry_thank_you_email_no_link')
   and trigger_event = 'inquiry_submitted';

-- ── 4. The button goes into the notice she already gets ──────────────────────
--
-- Appended, not inserted mid-body, so the notice reads: who inquired, how to
-- reach them, and then the thing to do about it.

update public.admissions_communication_templates
   set body = body ||
         E'<p><strong>This family has not heard from us yet.</strong> Nothing is sent until you send it.</p>'
         '<p><a href="{{interest_link_action}}">Send them the interest meeting link</a></p>',
       updated_at = now()
 where template_key = 'inquiry_staff_alert'
   and body not like '%{{interest_link_action}}%';

-- ── 5. The two chase letters, seeded OFF ─────────────────────────────────────
--
-- One per campus, because enqueue looks a template up by key within the
-- lead's school. Both on staff_email so neither can reach the family.
--
-- THE 72-HOUR ONE REACHES JIMMY AND DANNI as well as the campus, and that is
-- done in code rather than here: network-office.ts adds the pair for
-- trigger_event 'staff_interest_link_escalation'. The campus is the thing
-- being escalated about, so it is told too.

do $$
declare
  sch record;
  seeded integer := 0;
begin
  for sch in select id, name from public.schools loop

    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    select sch.id,
           'staff_interest_link_not_sent',
           'The interest meeting link has not been sent',
           'staff_email',
           'staff_interest_link_not_sent',
           'Not yet contacted — {{student_name}}',
           E'{{student_name}} inquired at {{school_name}} and has not heard anything from us.\n\nParent: {{guardian_name}}\nEmail: {{guardian_email}}\nPhone: {{guardian_phone}}\n\nWhat they told us about {{student_first_name}}:\n"{{inquiry_notes}}"\n\nSend them the interest meeting link here:\n\n{{interest_link_action}}\n\nNothing reaches this family until you do.',
           0, false, 'admissions'
    where not exists (
      select 1 from public.admissions_communication_templates x
       where x.school_id = sch.id and x.template_key = 'staff_interest_link_not_sent'
    );
    if found then seeded := seeded + 1; end if;

    insert into public.admissions_communication_templates
      (school_id, template_key, name, channel, trigger_event, subject, body,
       delay_hours, is_active, category)
    select sch.id,
           'staff_interest_link_escalation',
           'Three days, nobody has contacted this family',
           'staff_email',
           'staff_interest_link_escalation',
           'Three days, no contact — {{student_name}} at {{school_name}}',
           E'{{student_name}} inquired at {{school_name}} three days ago and nobody has sent them anything.\n\nParent: {{guardian_name}}\nEmail: {{guardian_email}}\nPhone: {{guardian_phone}}\n\nWhat they told us about {{student_first_name}}:\n"{{inquiry_notes}}"\n\nThe link is still live:\n\n{{interest_link_action}}\n\nTwo reminders have gone to the campus and the link has not been sent.',
           0, false, 'admissions'
    where not exists (
      select 1 from public.admissions_communication_templates x
       where x.school_id = sch.id and x.template_key = 'staff_interest_link_escalation'
    );
    if found then seeded := seeded + 1; end if;

  end loop;

  raise notice 'Seeded % chase templates.', seeded;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT eleven rows.
--
--   2  the thank-you letters, both now on interest_meeting_link_sent
--   1  inquiry_staff_alert, reading 'carries the send button'
--   8  the two chase letters at four campuses, every one 'off'
--
-- Then a COUNT row reading 0: nothing is left firing a family letter on
-- inquiry_submitted. If it is above zero, a campus holds an overriding copy
-- of one of the thank-you letters and that campus is still emailing families
-- automatically.

select * from (

select 1 as seq,
       coalesce(sc.name, 'every campus')                        as applies_to,
       t.template_key,
       t.trigger_event,
       case when t.is_active then 'ON' else 'off' end           as state,
       case
         when t.template_key = 'inquiry_staff_alert' then
           case when t.body like '%{{interest_link_action}}%'
                then 'carries the send button'
                else '*** NO SEND BUTTON ***' end
         when t.template_key like 'inquiry_thank_you%' then
           case when t.trigger_event = 'interest_meeting_link_sent'
                then 'sent by a person, not the form'
                else '*** STILL AUTOMATIC ***' end
         else 'chase letter, awaiting approval'
       end                                                      as check_

  from public.admissions_communication_templates t
  left join public.schools sc on sc.id = t.school_id
 where t.template_key in (
         'inquiry_thank_you_email',
         'inquiry_thank_you_email_no_link',
         'inquiry_staff_alert',
         'staff_interest_link_not_sent',
         'staff_interest_link_escalation'
       )

union all

select 2,
       '',
       'COUNT family letters still firing on inquiry',
       count(*)::text,
       '',
       case when count(*) = 0
            then 'none — the family hears nothing until she sends'
            else '*** A FAMILY LETTER IS STILL AUTOMATIC ***' end
  from public.admissions_communication_templates t
 where t.trigger_event = 'inquiry_submitted'
   and t.channel in ('email', 'sms')

) rows
order by seq, applies_to, template_key;
