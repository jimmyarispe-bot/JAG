-- 296_merge_field_audit_2026_09_07.sql
--
-- Fix the escalation template, then audit EVERY template for placeholders that
-- do not exist.
--
-- WHY. Migration 294 seeded four live parent-reminder templates written against
-- placeholder names that read naturally -- {{guardian_first_name}},
-- {{student_first_name}}, {{enrollment_link}} -- and were not in MERGE_FIELDS.
-- renderTemplate (merge-fields.ts) leaves an UNKNOWN token in place as literal
-- text, so three families were about forty-eight hours from receiving:
--
--     Hi {{guardian_first_name}},
--     Congratulations again on {{student_first_name}}'s place at The Academy GA.
--     ... not final until it is: {{enrollment_link}}
--
-- Caught 7 Sept; all 20 templates set is_active = false the same night.
--
-- Six of the nine missing fields now exist in code (guardian_first_name,
-- student_first_name, guardian_name, guardian_email, guardian_phone,
-- enrollment_link). The other three cannot be fixed that way -- see part 1.
--
-- SUPABASE NOTE: the editor shows only the LAST result set. The final SELECT is
-- the report.

begin;

-- ---------------------------------------------------------------------------
-- 1. Rewrite the staff escalation body.
--
--    {{wait_description}}, {{waiting_since}} and {{reminder_dates}} are NOT
--    fixable by adding merge fields, because they can never reach the renderer.
--    The reminder job enqueues a row carrying only lead_id and template_id
--    (parent-reminders.ts, enqueue()), and the queue processor rebuilds the
--    merge context FROM THE LEAD (engine.ts, loadMergeContextsForQueue).
--    Per-reminder facts -- which wait, since when, chased on which dates -- are
--    not on the lead and have nowhere to travel.
--
--    Adding that plumbing is a real change to how the queue works. The cheaper
--    and better answer is that the escalation does not need to recite the
--    history: it needs to get a human to the family. Name, email, phone and a
--    link to the lead do that, and the lead page has the detail.
-- ---------------------------------------------------------------------------

update public.admissions_communication_templates
   set body = E'{{student_name}} at {{school_name}} has not responded to three reminders about enrollment.\n\nParent: {{guardian_name}}\nEmail: {{guardian_email}}\nPhone: {{guardian_phone}}\n\nAutomated reminders have stopped for this family. Someone should call them, or mark the lead as not proceeding.\n\n{{lead_link}}',
       subject = 'No response after three reminders - {{student_name}}',
       updated_at = now()
 where template_key = 'staff_parent_unresponsive';

-- ---------------------------------------------------------------------------
-- 2. The audit.
--
--    Every {{token}} in every subject and body, across every template, checked
--    against the real MERGE_FIELDS list. This is the check that should have
--    existed before 294 ran, and it covers templates nobody has looked at in
--    months as well as the five from this week.
--
--    The list below is generated from
--    src/lib/admissions/communications/types.ts. If a field is added there,
--    add it here too -- or better, re-run this migration's report after any
--    template change.
-- ---------------------------------------------------------------------------

drop table if exists _valid_merge_fields;
create temp table _valid_merge_fields (field text primary key);

insert into _valid_merge_fields (field) values
    ('student_name'),
    ('parent_name'),
    ('parent_email'),
    ('parent_phone'),
    ('guardian_first_name'),
    ('student_first_name'),
    ('guardian_name'),
    ('guardian_email'),
    ('guardian_phone'),
    ('school_name'),
    ('program_name'),
    ('campus_name'),
    ('campus_address'),
    ('parking_info'),
    ('funding_program'),
    ('funding_source'),
    ('portal_link'),
    ('application_link'),
    ('upload_link'),
    ('enrollment_link'),
    ('scheduling_link'),
    ('shadow_days_link'),
    ('decisions_link'),
    ('admissions_contact_name'),
    ('admissions_contact_email'),
    ('lead_link'),
    ('tour_datetime'),
    ('interview_datetime'),
    ('missing_items'),
    ('missing_documents'),
    ('uploaded_documents'),
    ('award_amount'),
    ('award_id'),
    ('state_student_id'),
    ('rejection_reason'),
    ('next_steps'),
    ('requested_items'),
    ('deadline'),
    ('decision_timeframe'),
    ('tuition_info'),
    ('orientation_info'),
    ('technology_info'),
    ('waitlist_timeline'),
    ('student_schedule'),
    ('teacher_assignment'),
    ('first_day_info'),
    ('handbook_link');

drop table if exists _merge_field_audit;
create temp table _merge_field_audit as
with tokens as (
  select t.id,
         t.school_id,
         t.template_key,
         t.is_active,
         -- \w+ inside {{ }} -- the same pattern renderTemplate uses.
         (regexp_matches(coalesce(t.subject, '') || ' ' || coalesce(t.body, ''),
                         '\{\{(\w+)\}\}', 'g'))[1] as token
    from public.admissions_communication_templates t
)
select tk.template_key,
       tk.token,
       count(*)                                     as occurrences,
       count(distinct tk.school_id)                 as schools,
       bool_or(tk.is_active)                        as any_active
  from tokens tk
  left join _valid_merge_fields v on v.field = tk.token
 where v.field is null
 group by tk.template_key, tk.token;

-- ---------------------------------------------------------------------------
-- 3. Report
-- ---------------------------------------------------------------------------

drop table if exists _report;
create temp table _report (seq integer, item text, value text);

do $$
declare
  v_bad_tokens  integer;
  v_bad_tmpl    integer;
  v_active_bad  integer;
  v_reminders   integer;
  v_disabled    integer;
begin
  select count(*), count(distinct template_key),
         count(*) filter (where any_active)
    into v_bad_tokens, v_bad_tmpl, v_active_bad
    from _merge_field_audit;

  select count(*),
         count(*) filter (where not is_active)
    into v_reminders, v_disabled
    from public.admissions_communication_templates
   where template_key like 'parent_reminder_%'
      or template_key = 'staff_parent_unresponsive';

  insert into _report values
    (1, 'Escalation template rewritten',
        'staff_parent_unresponsive -- now uses only real fields'),
    (2, 'Reminder templates present (expect 20)', v_reminders::text),
    (3, 'Of those, still DISABLED (expect 20)',   v_disabled::text),
    (10, 'Unknown placeholders found',            v_bad_tokens::text),
    (11, 'Templates affected',                    v_bad_tmpl::text),
    (12, 'Of those, on an ACTIVE template',       v_active_bad::text),
    (20, 'Next step',
        case when v_active_bad > 0
             then 'FIX THE ACTIVE ONES BELOW FIRST -- they can mail literal braces today'
             else 'No active template has an unknown placeholder.'
        end);
end $$;

commit;

-- The report, then the offenders. Supabase shows only the LAST result set, so
-- run this select, then scroll to the one after it.
select item, value from _report order by seq;

select template_key,
       token           as unknown_placeholder,
       occurrences,
       schools,
       any_active      as on_an_active_template
  from _merge_field_audit
 order by any_active desc, template_key, token;

-- ---------------------------------------------------------------------------
-- WHAT THIS DOES NOT DO
--
-- It does NOT re-enable the reminder templates. Before that:
--   1. Deploy the merge-field code (guardian_first_name, student_first_name,
--      guardian_name, guardian_email, guardian_phone, enrollment_link).
--   2. Render one against a real lead and READ THE OUTPUT TEXT. Not a
--      typecheck -- the actual words a parent would receive.
--   3. Then:
--        update public.admissions_communication_templates
--           set is_active = true
--         where template_key like 'parent_reminder_%'
--            or template_key = 'staff_parent_unresponsive';
--
-- ONE MORE THING THIS CANNOT SEE. A field can be KNOWN and still render as an
-- empty string -- shadow_days_link is `ctx.shadowDaysUrl ?? ""`. A school with
-- no booking URL sends "You can book here: " with nothing after it. That is a
-- guard at the sending site, not a placeholder check, and it is still open.
-- ---------------------------------------------------------------------------
