-- 533_the_staff_acceptance_notice_loses_the_checklist_2026_10_09.sql
--
-- Jimmy, 9 October, on staff_application_accepted - the notice that goes to
-- the campus and the network office when a child is accepted. Pointing at
-- the four-line checklist in the middle of it: "delete this".
--
--     The business process begins now:
--
--       1. Schedule of tuition payments
--       2. Enrollment contract
--       3. Parent payment processing
--       4. Initial deposit - the first monthly payment
--
-- Gone. The sentence above it already says what happens - "the family has
-- been told that the business office contacts them next" - and the people
-- who receive this notice run that process. A numbered list telling them
-- their own job is noise in an email whose only real purpose is the child's
-- name, the parent's address and the link to the record.
--
-- THE FAMILY'S LETTER KEEPS ITS THREE BULLETS. student_accepted_email still
-- tells a mother what the business office will contact her about, and that
-- is the one audience for whom the list is news. This is the staff copy.
--
-- ONE NETWORK ROW. No campus overrides for this template.

begin;

update public.admissions_communication_templates
   set body = replace(
         body,
         E'The business process begins now:\r\n\r\n  1. Schedule of tuition payments\r\n  2. Enrollment contract\r\n  3. Parent payment processing\r\n  4. Initial deposit — the first monthly payment\r\n\r\n',
         ''
       ),
       updated_at = now()
 where template_key = 'staff_application_accepted';

do $$
declare v_body text;
begin
  select body into v_body
    from public.admissions_communication_templates
   where template_key = 'staff_application_accepted';

  /* The replace is anchored on exact CRLF line endings. If the stored row
     ever used bare newlines it would silently match nothing and this file
     would report success having changed not one character. */
  if position('The business process begins now' in v_body) > 0 then
    raise exception
      'The checklist is still there - the line endings did not match and nothing was removed.';
  end if;
  if position('Parent: {{parent_name}}' in v_body) = 0 then
    raise exception 'The parent line is missing. Too much was removed.';
  end if;
  if position('The family has been told' in v_body) = 0 then
    raise exception 'The sentence above the checklist is missing. Too much was removed.';
  end if;
  raise notice 'Checklist removed; the rest of the notice is intact.';
end $$;

commit;

-- ============================================================================
-- WHAT A SCHOOL LEADER NOW READS
-- ============================================================================
--
--   Subject: Accepted: Jayden Roy — The Academy Virtual
--
--   Jayden Roy has been accepted to The Academy Virtual.
--
--   The family has been told, and told that the business office contacts
--   them next.
--
--   Parent: Tara Towa (tara1n6@yahoo.com)
--   The record: <link>
