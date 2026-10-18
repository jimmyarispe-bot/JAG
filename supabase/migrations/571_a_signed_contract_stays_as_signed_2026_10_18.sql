-- ============================================================================
-- 571  A SIGNED CONTRACT STAYS AS IT WAS SIGNED
--      18 October 2026
-- ============================================================================
--
-- The contract renders live: the family's figures are read from the plan,
-- the scholarships and the child's record every time it is shown. That is
-- what a contract being prepared should do.
--
-- Jimmy, the same evening: "i need to be able to change any information
-- during this stage". So the figures can change after a parent has signed.
-- A signed contract must not change with them - the parent agreed to the
-- text and figures in front of them at that moment, and the PDF either side
-- prints later must be that, not today's numbers.
--
-- So the moment the last part is signed, the rendered contract is kept here
-- and every later view of a completed packet shows this copy.
--
-- Additive only. No packet has ever been completed (zero signatures exist),
-- so nothing needs backfilling.
-- ============================================================================

begin;

alter table public.enrollment_packets
  add column if not exists signed_contract jsonb,
  add column if not exists signed_contract_at timestamptz;

comment on column public.enrollment_packets.signed_contract is
  'The contract exactly as signed: [{templateKey, title, sortOrder, html}], '
  'written when the last part is signed. Shown in place of the live render '
  'for a completed packet.';

commit;
