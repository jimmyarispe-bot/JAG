-- Nothing a family can sign should be a sentence that means nothing.
--
-- Jimmy, 26 September 2026, choosing what to deal with before the contract
-- work starts: disarm the placeholder contracts.
--
-- WHAT IS ARMED TODAY. enrollment_packet_templates holds five documents per
-- campus, every one is_active, and every one is a single placeholder sentence
-- standing in for a contract that was rewritten on 6 September and has never
-- been loaded. Migration 417 removed the sixth, which described "the terms of
-- the AcademyOS enrollment agreement" - the software's name, in a document a
-- parent would sign.
--
-- WHY IT MATTERS EVEN THOUGH NOTHING HAS USED IT. No packet has ever been
-- generated and no signature has ever been collected, because Accept does not
-- pass an application_id. That gap is a bug, and the day it is fixed the
-- packet mechanism starts working - against these five sentences. Four
-- signatures on four placeholders would enroll a student and invoice a family,
-- and the family's copy would be the sentence, not the agreement. The right
-- moment to disarm this is before the fix, not after.
--
-- DEACTIVATED, NOT DELETED. is_active = false is reversible, keeps the
-- template_keys and sort order that the packet generator expects, and leaves
-- the rows in place as the shape the real contracts will be poured into - or
-- as the thing we deliberately replace when the contracts move onto the form
-- engine instead. A delete would decide that question tonight.
--
-- Safe to re-run.

begin;

update public.enrollment_packet_templates
   set is_active  = false,
       updated_at = now()
 where is_active
   and length(regexp_replace(coalesce(body_html, ''), '<[^>]*>', '', 'g')) < 400;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Expect every row to read active = false and a short body length. A row still
-- reading true is one whose text is long enough to be a real document - look at
-- it before assuming it is safe, because length is a proxy for substance and
-- not a measure of it.
--
-- A campus with no active signature documents is the intended state right now:
-- families sign in the external form builder until the contracts move into JAG.

select s.name as campus,
       t.template_key,
       t.title,
       t.is_active as active,
       length(regexp_replace(coalesce(t.body_html, ''), '<[^>]*>', '', 'g')) as text_length,
       left(regexp_replace(coalesce(t.body_html, ''), '<[^>]*>', '', 'g'), 80) as begins
  from public.enrollment_packet_templates t
  join public.schools s on s.id = t.school_id
 order by s.name, t.sort_order, t.template_key;
