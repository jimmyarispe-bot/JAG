-- 484_five_days_no_application_2026_10_04.sql
--
-- RUN THIS *AFTER* THE CODE HAS DEPLOYED. The letter below uses
-- {{application_call_link}}, a merge field that does not exist until this
-- ship lands, and renderTemplate leaves an unknown token in place as literal
-- text - so in the wrong order a school leader reads the characters
-- {{application_call_link}} instead of a link.
--
-- Jimmy, 4 October 2026: "the 3 reminders need to go out at 24 hours, 72, 96
-- hours. if we don't receive an application after 5 days send the school
-- leader the same type of 'it's time to give the parent a call' email with
-- 'send application' and 'not moving forward' buttons and notes section".
--
-- THE CLOCK IS IN THE CODE, NOT HERE. parent-reminders.ts now carries a
-- schedule per wait, measured in hours from the moment the wait opened:
-- 24, 72, 96, escalate at 120. The two shadow-day and enrollment waits keep
-- 48 / 96 / 144 and escalate at 192, which is exactly what the old flat
-- 48-hour interval produced.
--
-- WHICH WAIT ACTUALLY FIRES, AND WHY IT IS NOT THE ONE YOU WOULD GUESS.
--
-- There are two application waits. application_not_started means we invited
-- them and NO application row exists; application_not_submitted means a row
-- exists with nothing submitted on it. Since 30 September an application row
-- is created at the moment of INVITATION - that is what gave the $100 fee
-- somewhere to live before submission - so for any family invited since then
-- the first wait cannot fire at all and the second one is the live path.
-- Jimmy was asked and said both. Both have the same schedule and the same
-- escalation letter, so it does not matter which one a family lands in.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS MIGRATION CREATES
--
--   1. admissions_leads.application_call_token - the single-use link in the
--      letter. A SECOND column rather than reusing interest_call_token,
--      because a family can be chased for an interest meeting and later for
--      an application, and the second link must not reopen the first page.
--
--   2. Two more values on lead_call_outcomes.outcome. The same table records
--      both pages: one row per decision, append-only in practice, so the
--      history of who tried what survives in one place.
--
--   3. staff_application_call_parent at every campus, SWITCHED OFF.
--
-- THE LETTER IS SEEDED INACTIVE ON PURPOSE. Jimmy sees the exact words a
-- human will read before they ship. Until he turns it on, the nightly job
-- runs, finds the five-day families, and reports "no
-- staff_application_call_parent template for school <id>" rather than sending
-- anything - which is the right behaviour for an unapproved letter and is
-- reported rather than silent.
--
-- Safe to re-run: every step is guarded.

begin;

-- ── 1. The token ─────────────────────────────────────────────────────────────

alter table public.admissions_leads
  add column if not exists application_call_token text;

create unique index if not exists idx_admissions_leads_application_call_token
  on public.admissions_leads(application_call_token)
  where application_call_token is not null;

comment on column public.admissions_leads.application_call_token is
  'Single-use link in the five-day no-application escalation. Opens '
  '/application-call/<token>, where a school leader re-sends the invitation '
  'or closes the lead. Minted once and reused, so a leader escalated twice '
  'does not find her first link dead.';

-- ── 2. Two more outcomes ─────────────────────────────────────────────────────
--
-- The check constraint was written inline in 479, so Postgres named it. It is
-- looked up rather than assumed, because a hard-coded name that does not
-- exist makes the drop a no-op and the add a duplicate - and the failure
-- would not show until a school leader pressed a button.

do $$
declare
  v_name text;
begin
  select con.conname into v_name
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'lead_call_outcomes'
     and con.contype = 'c'
     and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%';

  if v_name is null then
    raise notice 'No outcome check constraint found — nothing to replace.';
  else
    execute format(
      'alter table public.lead_call_outcomes drop constraint %I', v_name
    );
  end if;

  alter table public.lead_call_outcomes
    add constraint lead_call_outcomes_outcome_check
    check (outcome in (
      -- The interest-meeting call, /call/<token>. These only RECORD.
      'spoke_will_book',
      'spoke_not_proceeding',
      'left_message',
      'no_answer',
      -- The five-day application call, /application-call/<token>. These ACT:
      -- the first re-sends the invitation, the second marks the lead declined.
      'application_resent',
      'application_not_proceeding'
    ));
end $$;

-- ── 3. The letter ────────────────────────────────────────────────────────────
--
-- CHANNEL staff_email, NOT email. On 3 October staff_parent_unresponsive was
-- found sitting on channel 'email' at all four campuses - which means a staff
-- notice about a family, carrying that family's own name and telephone
-- number, addressed to the family. This one is on staff_email from the first
-- day so it cannot repeat that.
--
-- One row per campus, because the escalation is looked up by school.

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
           'staff_application_call_parent',
           'Five days, no application - time to call the parent',
           'staff_email',
           'staff_portal_message',
           'Time to call — no application from {{student_name}}',
           E'{{student_name}} at {{school_name}} was invited to apply five days ago. Three reminders have gone to the family and no application has been submitted.\n\nParent: {{guardian_name}}\nPhone: {{guardian_phone}}\nEmail: {{guardian_email}}\n\nIt is time to give the parent a call.\n\nWhen you have spoken to them, open this and say what happens next. You can send the application again, or close the inquiry out, and there is a place for notes:\n\n{{application_call_link}}\n\nAutomatic reminders have stopped for this family.',
           0, false, 'admissions'
    where not exists (
      select 1 from public.admissions_communication_templates x
       where x.school_id = sch.id
         and x.template_key = 'staff_application_call_parent'
    );
    if found then seeded := seeded + 1; end if;
  end loop;

  raise notice 'staff_application_call_parent seeded at % campuses.', seeded;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT five rows.
--
--   One per campus for the new letter - four of them - every one reading
--   'off' and 'staff_email'. OFF is correct: nothing goes out until you have
--   read the words and said so.
--
--   Then one COUNT row reading 6, which is the outcome constraint. If it
--   reads 4, the drop-and-add did not happen and both buttons on the new page
--   will fail the moment a school leader presses one.
--
-- THE COUNT ROW IS THERE ON PURPOSE. A verify that proves success by
-- returning no rows cannot tell "it worked" from "the query was wrong".

select 'letter'                                            as what,
       sc.name                                             as applies_to,
       t.channel,
       case when t.is_active then '*** ON ***' else 'off' end as state,
       case when t.body like '%{{application_call_link}}%'
            then 'carries the button link'
            else '*** NO LINK IN THE BODY ***' end         as link_check,
       t.subject

  from public.admissions_communication_templates t
  join public.schools sc on sc.id = t.school_id
 where t.template_key = 'staff_application_call_parent'

union all

select 'COUNT outcomes the constraint allows',
       '',
       '',
       count(*)::text,
       case when count(*) = 6
            then 'both buttons will save'
            else '*** THE CONSTRAINT WAS NOT REPLACED ***' end,
       ''
  from (
    select unnest(string_to_array(
             replace(replace(replace(
               split_part(
                 split_part(pg_get_constraintdef(con.oid), 'ARRAY[', 2),
                 ']', 1),
               '''', ''), '::text', ''), ' ', ''),
             ',')) as value
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'lead_call_outcomes'
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%spoke_will_book%'
  ) allowed

 order by what, applies_to;
