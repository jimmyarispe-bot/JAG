-- 576 - When the contract actually went to the parent.
--
-- The acceptance builds an enrollment packet marked "sent" the moment a child
-- is accepted. Finalizing Contract read that as "contract sent", so Harris
-- Borum's card said "Sent - waiting on the parent" and locked his scholarship
-- on 21 October 2026, when no contract had gone anywhere. Sent is now a fact
-- of its own, written only when the invitation succeeds.

alter table public.enrollment_packets
  add column if not exists contract_sent_at timestamptz;

comment on column public.enrollment_packets.contract_sent_at is
  'When Preview and send contract emailed the parent (migration 576). Null on the packet the acceptance builds.';

select count(*) as packets, count(contract_sent_at) as sent from public.enrollment_packets;
