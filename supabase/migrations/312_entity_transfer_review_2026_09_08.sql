-- 312_entity_transfer_review_2026_09_08.sql
--
-- Two things: it corrects something 311 wrote, and it builds the alarm for
-- next time. Requires 311.
--
-- WHAT 311 GOT WRONG
--
-- 311 found nine disbursements whose paying login belonged to a different
-- entity than the student now attends:
--
--     Samuel Johns     now The Academy HS   paid via AZ VIRTUAL   $10,874.25
--     Kingstyn Allen   now The Academy HS   paid via AZ VIRTUAL    $3,971.04
--                                                                 ----------
--                                                                 $14,845.29
--
-- and stamped every one of them "SCHOOL ATTRIBUTION CONFLICT ... UNRESOLVED".
--
-- It is not a conflict and it is not unresolved. Both students were at The
-- Academy Virtual when those payments settled and moved to The Academy HS
-- afterwards. The roster stores only where a student is NOW; a disbursement
-- records where the money was EARNED. Those are different questions about
-- different dates and both answers are right.
--
-- The underlying loaded data was never wrong - funder_accounts.school_id is
-- still the entity that earned the revenue, and no amount moves. Only the
-- commentary was wrong, and commentary that misleads is worth the migration to
-- fix, because in four months the note is all anyone will have.
--
-- WHAT HAPPENS FROM HERE
--
-- Jimmy, 2026-09-08: this should not happen going forward. Each entity's login
-- pays only its own students from now on. So the same pattern, dated later,
-- stops being history and becomes a fault - a family still paying into a stale
-- account, or a transfer that never reached the portal.
--
-- funder_disbursement_entity_review below is that alarm, and the settlement
-- date is what separates the two cases. It is deliberately NOT a check
-- constraint: a constraint would refuse the insert, and refusing to record
-- money that genuinely arrived would make the ledger less true rather than
-- more. The money is real whether or not the accounts are tidy.
--
-- SAFE TO RE-RUN.

begin;

-- ---------------------------------------------------------------------------
-- 1. Correct the note.
-- ---------------------------------------------------------------------------
-- The conflict text is always the last thing 311 appended, so it can be cut
-- from its marker to the end of the note and replaced. Anchored on $ rather
-- than matched loosely, so a note that does not carry the marker is untouched.

update public.funder_disbursements d
   set notes = regexp_replace(
         d.notes,
         E'\nSCHOOL ATTRIBUTION CONFLICT:.*$',
         E'\nENTITY DIFFERS FROM CURRENT PLACEMENT, AND THAT IS CORRECT: this money was earned '
         'through a different entity''s ClassWallet login than the roster now shows for this '
         'student, because the student TRANSFERRED after these payments settled. A school is a '
         'point-in-time fact. Revenue stays with the entity that earned it; the roster stays '
         'current. Confirmed by Jimmy 2026-09-08 - nothing to resolve. '
         'From 2026-09-08 each entity''s login pays only its own students, so this same pattern '
         'on a LATER settlement date is a fault, not history. See funder_disbursement_entity_review.'
       ),
       updated_at = now()
 where d.notes like '%SCHOOL ATTRIBUTION CONFLICT:%';

-- ---------------------------------------------------------------------------
-- 2. The alarm for next time.
-- ---------------------------------------------------------------------------

create or replace view public.funder_disbursement_entity_review
with (security_invoker = on) as
select
  case when d.settled_on <= date '2026-09-08'
       then 'historical - transfer'
       else 'REVIEW' end                    as verdict,
  d.settled_on,
  fa.platform,
  fa.account_label                          as paid_through,
  ls.name                                   as login_entity,
  st.first_name || ' ' || st.last_name      as student,
  rs.name                                   as student_now_at,
  d.payer_account_name,
  d.external_order_id,
  d.net_amount
from public.funder_disbursements d
join public.funder_accounts fa on fa.id = d.funder_account_id
join public.schools ls        on ls.id = fa.school_id
join public.students st       on st.id = d.student_id
join public.schools rs        on rs.id = st.school_id
where d.match_status = 'matched'
  and rs.id is distinct from ls.id
order by d.settled_on desc;

comment on view public.funder_disbursement_entity_review is
  'Matched disbursements whose paying login belongs to a different entity than the student attends now. Rows settled on or before 2026-09-08 are historical transfers and are correct as recorded. Anything later is a fault to chase: from that date each entity pays only its own students.';

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification. Expect 9 rows, EVERY ONE 'historical - transfer':
--
--   7 x Samuel Johns    AZ Virtual login -> now The Academy HS   $10,874.25
--   2 x Kingstyn Allen  AZ Virtual login -> now The Academy HS    $3,971.04
--
-- A row reading 'REVIEW' means a payment came through the wrong entity's login
-- after the practice changed, and wants chasing.
-- ---------------------------------------------------------------------------

select verdict, settled_on, paid_through, student, student_now_at, net_amount
from public.funder_disbursement_entity_review;
