/*
  415 — ACCEPTANCE HANDS THE FAMILY TO THE BUSINESS OFFICE

  WHAT JIMMY ASKED FOR, 24 September 2026, verbatim:

    "after the shadow days completed and then the decision is made, the parent
     should receive an email notifying them that the child has been accepted to
     the school from the school leader and the next communication will come from
     the business office to finalize the schedule of tuition payments, contract,
     and initial deposit (1st month's payment). ... Jimmy Arispe should be
     notified in the jag and by email that a student has been accepted and that
     begins the business process."

  TWO THINGS WERE WRONG.

  1. THE FAMILY'S LETTER GAVE THEM FOUR HOMEWORK ITEMS. It read:

       Enrollment steps:
       1. Complete enrollment packet: {{portal_link}}
       2. Review tuition: {{tuition_info}}
       3. Orientation: {{orientation_info}}
       4. Technology setup: {{technology_info}}

     Three of those four tokens render fixed sentences that say details will
     follow later, and the portal link sends a family who has no account to a
     password box. So the one email that should feel like an arrival handed
     them a to-do list, half of it empty, and signed it "Admissions" rather
     than the person who met their child.

  2. NOBODY WAS TOLD. The staff template for this event existed and was
     `is_active = true`, which is exactly why nobody noticed: it sat on the
     `internal_note` channel. internal_note RECORDS a message and never SENDS
     one. A row appeared, no mail left the building, and no error was raised -
     the house failure, a policy of silence wearing a success costume.

     It is moved to `staff_email`, which is the channel that actually delivers
     to a school's notification contacts. Code (network-office.ts) adds the
     network office to the recipients for this one event, because acceptance is
     the moment admissions hands a family to the business office and three of
     the four campuses did not list him.

  WHY UPDATE AND NOT INSERT. Both rows already exist with school_id null, which
  is the network-wide default every campus falls back to. Inserting would leave
  two candidates for one trigger and the engine would send both.

  THE FAMILY'S LETTER IS JIMMY'S OWN WORDING, 24 September, with one change he
  was told about: he wrote "welcome him and your family". Gender is not recorded
  on a lead - zero of 107 students carry it - so a fixed "him" would reach a
  girl's family. {{student_first_name}} says the same warmth and cannot be wrong
  about a child.

  NOTHING HERE TOUCHES THE DECLINE LETTER. There still isn't one, and writing
  one is Jimmy's to approve, not this migration's to invent.
*/

update public.admissions_communication_templates
set
  subject = '{{student_name}} has been accepted to {{school_name}}',
  body = $letter$Dear {{parent_name}},

It is my privilege to tell you that {{student_name}} has been accepted to {{school_name}}.

We spent the shadow days with your child and are very excited to welcome {{student_first_name}} and your family to the {{school_name}} family.

Here is what happens next, and there is nothing for you to do until our business office contacts you directly to finalize three things:

  • your schedule of tuition payments
  • your enrollment contract
  • your initial deposit, which is your first monthly payment

That will come as a separate email from the business office.

If you have any questions before then, simply reply to this message and it will come directly to me.

Warmly,

{{admissions_contact_name}}
{{school_name}}$letter$,
  is_active = true
where trigger_event = 'student_accepted';

/*
  The staff notice. Channel changed from internal_note to staff_email — this is
  the whole reason nobody has ever been told.
*/
update public.admissions_communication_templates
set
  channel = 'staff_email',
  subject = 'Accepted: {{student_name}} — {{school_name}}',
  body = $staff${{student_name}} has been accepted to {{school_name}}.

The family has been told, and told that the business office contacts them next.

The business process begins now:

  1. Schedule of tuition payments
  2. Enrollment contract
  3. Parent payment processing
  4. Initial deposit — the first monthly payment

Parent: {{parent_name}} ({{parent_email}})
The record: {{lead_link}}$staff$,
  is_active = true
where trigger_event = 'staff_application_accepted';

/*
  PROVE IT LANDED. Both updates must have changed exactly one row. A template
  that did not move is the failure this migration exists to end, so it fails
  loudly here rather than being discovered the next time a child is accepted.
*/
do $$
declare
  v_family int;
  v_staff int;
begin
  select count(*) into v_family
  from public.admissions_communication_templates
  where trigger_event = 'student_accepted'
    and channel = 'email'
    and is_active
    and body like '%business office contacts you directly%';

  select count(*) into v_staff
  from public.admissions_communication_templates
  where trigger_event = 'staff_application_accepted'
    and channel = 'staff_email'
    and is_active;

  if v_family < 1 then
    raise exception 'The family acceptance letter was not updated (% rows match)', v_family;
  end if;

  if v_staff < 1 then
    raise exception 'The staff acceptance notice is still not on staff_email (% rows match)', v_staff;
  end if;

  raise notice 'Acceptance letters updated: % family, % staff', v_family, v_staff;
end $$;
