-- ============================================================================
-- 565  A LEADER SCANNING FOR A RECORD
--      17 October 2026
-- ============================================================================
--
-- Two edits to decision_gate_staff_email, both found by Jimmy reading a real
-- letter in Danni's inbox.
--
-- ── 1. THE CHILD'S FULL NAME, BECAUSE THIS LETTER IS FOR STAFF ─────────────
--
-- The letter read "Athena is waiting on your decision." Athena Betras is at
-- The Academy FL with an open invite_to_apply gate, and Danni was given one
-- word to find her by.
--
-- {{student_name}} resolves to the PREFERRED name when a child has one. The
-- codebase already says, on student_full_name in types.ts:
--
--   "SEPARATE FROM student_name, which returns the preferred name when there
--    is one. That is right in a letter to a family, who call the child what
--    they call the child, and wrong on a staff letter a school leader is
--    scanning for a record: 'Birdie' does not find Beatrice Okonkwo."
--
-- That field was added for exactly this letter's problem and this letter was
-- never moved onto it. Subject and body both.
--
-- THE FAMILY'S LETTERS ARE NOT TOUCHED. A parent reads the name they use for
-- their own child; only the staff letter changes.
--
-- ── 2. AMERICAN ENGLISH ────────────────────────────────────────────────────
--
-- "please do not forward this email for someone else to action" - "action"
-- as a verb is British corporate English. Jimmy, 30 September: "also
-- remember american english. enrollment, program - 2 examples."
--
-- "to answer" rather than "to handle", because the sentence before it is
-- about the answer being recorded against her name, and the button says
-- Open the decision.
--
-- ============================================================================

begin;

-- ── THE GUARD, BEFORE ──────────────────────────────────────────────────────

do $$
declare
  n_rows integer;
begin
  select count(*) into n_rows
  from public.admissions_communication_templates
  where template_key = 'decision_gate_staff_email';
  if n_rows <> 1 then
    raise exception 'Refusing: expected exactly 1 decision_gate_staff_email row, found %.', n_rows;
  end if;

  if not exists (
    select 1 from public.admissions_communication_templates
    where template_key = 'decision_gate_staff_email'
      and subject = 'Decision needed: {{student_name}}'
      and body like '{{student_name}} is waiting on your decision.%'
      and body like '%for someone else to action.%'
  ) then
    raise exception
      'Refusing: decision_gate_staff_email does not read as this file expects. Somebody has edited it.';
  end if;
end $$;

-- ── THE EDITS ──────────────────────────────────────────────────────────────

update public.admissions_communication_templates
   set subject = 'Decision needed: {{student_full_name}}',
       body = replace(
                replace(body,
                  '{{student_name}} is waiting on your decision.',
                  '{{student_full_name}} is waiting on your decision.'),
                'for someone else to action.',
                'for someone else to answer.'),
       updated_at = now()
 where template_key = 'decision_gate_staff_email';

-- ── THE GUARD, AFTER ───────────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from public.admissions_communication_templates
    where template_key = 'decision_gate_staff_email'
      and subject = 'Decision needed: {{student_full_name}}'
      and body like '{{student_full_name}} is waiting on your decision.%'
      and body like '%for someone else to answer.%'
      and body not like '%{{student_name}}%'
      and body not like '%to action%'
      -- Everything else must survive: the link, the skip button, the sentence
      -- about the answer being recorded against her name.
      and body like '%{{decisions_link}}%'
      and body like '%{{skip_stage_link}}%'
      and body like '%The answer is recorded against your name%'
  ) then
    raise exception 'Refusing: the letter did not come out as intended.';
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select template_key, subject, body
from public.admissions_communication_templates
where template_key = 'decision_gate_staff_email';
