/*
  417 — NO FAMILY SIGNS AN AGREEMENT WITH A PRODUCT

  THE DOCUMENT BEING DELETED, in full. This is its entire body, on all four
  campuses:

      I agree to enroll my student under the terms of the AcademyOS
      enrollment agreement.

  AcademyOS is the platform. A family would have been signing their enrollment
  with a piece of software they have never heard of, under terms that do not
  exist anywhere - there is no "AcademyOS enrollment agreement" to point at.

  Jimmy, 25 September: "delete this text and the actual document".

  WHAT THIS CHANGES. `enrollment_agreement` required a signature, so it was one
  of five documents standing between an accepted family and enrollment. After
  this there are four: ferpa, parent_handbook, technology_agreement and
  tuition_agreement, plus media_release which needs no signature.

  SAFE TO DELETE RATHER THAN DEACTIVATE. No enrollment packet has ever been
  created and no signature has ever been collected - both tables are empty
  (supabase/diagnostics/show_me_the_enrollment_documents_2026_09_25.sql), so
  nothing references these rows and no family's signed record is disturbed.
  Were either table populated this would have deactivated the rows instead,
  because deleting a document somebody has signed destroys the evidence that
  they signed it.

  THE OTHER FIVE ARE STILL PLACEHOLDERS, and this migration deliberately does
  not touch them. Every one is a single sentence, and none of them mentions a
  tuition figure, a payment date, the late-fee terms or suspension. The real
  Enrollment and Tuition Contract - revised for GA and FL on 6 September -
  lives as a document and has never been put in front of a family through JAG.
  Deleting the worst of the six is not the same as fixing the set, and the set
  is still armed.

  TO PUT IT BACK: this file is the record of what it said.
*/

delete from public.enrollment_packet_templates
where template_key = 'enrollment_agreement';

/*
  PROVE IT. Zero rows left under that key, and the remaining set is still
  enumerable - signEnrollmentDocument refuses to complete a packet for a
  school with no active signature documents, so a delete that emptied a campus
  would block enrollment rather than simplify it.
*/
do $$
declare
  v_left int;
  v_bare int;
begin
  select count(*) into v_left
  from public.enrollment_packet_templates
  where template_key = 'enrollment_agreement';

  if v_left > 0 then
    raise exception 'enrollment_agreement still has % rows', v_left;
  end if;

  select count(*) into v_bare
  from public.schools s
  where not exists (
    select 1
    from public.enrollment_packet_templates t
    where t.school_id = s.id
      and t.is_active
      and t.requires_signature
  );

  if v_bare > 0 then
    raise exception
      '% school(s) now have no signature documents at all, which blocks enrollment', v_bare;
  end if;

  raise notice 'enrollment_agreement deleted; every campus still has signature documents';
end $$;
