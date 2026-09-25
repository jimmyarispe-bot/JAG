/*
  SHOW ME THE ENROLLMENT DOCUMENTS — 2026-09-25
  Read-only. Nothing here writes.

  WHY. Jimmy: "what are you referring to as the enrollment packet" and then
  "show me one of these enrollment_packet_templates". Fair - it is a name in
  the code, not something he designed, and I used it as though he would
  recognise it.

  These rows are what a family is asked to sign after being accepted. When
  every row marked requires_signature has a signature against it, JAG treats
  enrollment as agreed and creates the student, activates them and generates
  their first invoice. So whatever is in here IS the contract, as far as the
  platform is concerned.

  WHAT EMPTY MEANS, decided before running it:

  1. ZERO ROWS IS A FINDING, and a serious one. It would mean no campus has any
     enrollment document at all - and signEnrollmentDocument refuses to
     complete a packet for a school with none, so accepting a student today
     would produce a packet the family cannot finish. Not a blank; a blocked
     enrollment.
  2. zero rows means no student has ever been given a packet. Expected, since
     only one lead has ever reached accepted.
  3. zero rows means nobody has ever signed anything here.
*/

select
  '1. the documents' as check,
  coalesce(s.name, 'ALL CAMPUSES (school_id is null)')
    || ' | ' || t.template_key as detail,
  'title=' || coalesce(t.title, 'NO TITLE')
    || ' | signature required=' || coalesce(t.requires_signature::text, 'NULL')
    || ' | active=' || coalesce(t.is_active::text, 'NULL')
    || ' | body=' || coalesce(left(t.body_html, 600), 'NO BODY') as extra
from public.enrollment_packet_templates t
left join public.schools s on s.id = t.school_id

union all

select
  '2. packets ever created',
  coalesce(to_char(p.generated_at, 'YYYY-MM-DD HH24:MI'), 'no date'),
  'status=' || coalesce(p.packet_status, 'NULL')
    || ' | completed=' || coalesce(p.completed_at::text, 'not completed')
    || ' | lead=' || coalesce(p.lead_id::text, 'NULL')
from public.enrollment_packets p

union all

select
  '3. signatures ever collected',
  coalesce(g.template_key, 'no key'),
  coalesce(g.signer_name, 'no name')
    || ' <' || coalesce(g.signer_email, 'no email') || '>'
    || ' | typed: ' || coalesce(g.signature_text, 'nothing')
from public.enrollment_packet_signatures g

order by 1, 2;
