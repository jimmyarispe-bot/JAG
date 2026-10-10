-- 537_the_tour_invitation_goes_live_2026_10_10.sql
--
-- ⚠ RUN THIS *BEFORE* SETTING ADMISSIONS_TOUR_GATE, NOT AFTER.
--
-- The two have to happen in this order and the cost of the wrong order is a
-- family left waiting. With the gate armed and this letter still off, a
-- school leader at GA or FL finishes an interest conversation, presses
-- "Send the tour request", the child moves to Tour Requested - and NOTHING
-- REACHES THE FAMILY. They are waiting for a link that was never sent, and
-- the board says we are waiting for them.
--
-- ── WHAT THIS IS ────────────────────────────────────────────────────────────
--
-- Jimmy, 10 October, on the tour step: "do 1 n 2". This is 1.
--
-- The letter itself was written on 5 October in migration 508 and seeded
-- switched off, which is this build's standing rule - words ship dark and
-- Jimmy arms them once he has read them. He read them on the chart at T1
-- before saying this.
--
-- ── WHAT WAS ALREADY TRUE ───────────────────────────────────────────────────
--
-- Checked against production on 10 October before writing this:
--
--   tour_booking_url      SET at GA and at FL - real Google appointment
--                         schedules, so {{tour_link}} resolves
--   tour_confirmation     ON - and proven: Candace Martin received hers at
--                         11:21 on 9 October
--   tour_reminder_24h     ON, delay 24h
--   tour_invitation_email off at GA, off at FL   <- the only gap
--
-- So the tour step is one switch and one environment variable from working
-- end to end, and this is the switch.
--
-- ── GA AND FL ONLY ──────────────────────────────────────────────────────────
--
-- No tour_invitation_email row exists at HS or Virtual and none is created
-- here. Those two campuses have no tour in their flow - the shadow day comes
-- straight after the virtual interest meeting - and neither has a
-- tour_booking_url. campusRunsTours() already refuses them in code; this
-- just does not contradict it in the database.
--
-- Safe to re-run: the update is a no-op once both rows are on, and says so.

begin;

do $$
declare
  touched integer;
begin
  update public.admissions_communication_templates t
     set is_active = true, updated_at = now()
    from public.schools s
   where s.id = t.school_id
     and t.template_key = 'tour_invitation_email'
     and s.name in ('The Academy GA', 'The Academy FL')
     and t.is_active is distinct from true;

  get diagnostics touched = row_count;
  raise notice 'tour invitations switched on: %.', touched;
  if touched = 0 then
    raise notice 'nothing changed - already on at both campuses, or the rows are missing.';
  end if;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
--
-- EXPECT three rows.
--
--   The Academy FL   ON   link resolves
--   The Academy GA   ON   link resolves
--   COUNT campuses ready for the gate : 2   <- the one that matters
--
-- If the count is anything but 2, DO NOT SET ADMISSIONS_TOUR_GATE. A campus
-- that is not ready sends a family nothing and shows the leader a child
-- waiting on them.

select s.name as campus,
       case when t.is_active then 'ON' else '*** STILL OFF ***' end as letter,
       case when coalesce(btrim(s.tour_booking_url), '') = ''
            then '*** NO TOUR CALENDAR ***'
            when t.body not like '%{{tour_link}}%'
            then '*** LETTER HAS NO LINK IN IT ***'
            else 'link resolves' end as calendar,
       coalesce(substring(t.body from 'You can choose your time here.{0,30}'), '—') as the_line
  from public.admissions_communication_templates t
  join public.schools s on s.id = t.school_id
 where t.template_key = 'tour_invitation_email'

union all

select 'COUNT campuses ready for the gate',
       count(*)::text,
       case when count(*) = 2 then 'correct — set ADMISSIONS_TOUR_GATE now'
            else '*** DO NOT SET THE GATE YET ***' end,
       ''
  from public.admissions_communication_templates t
  join public.schools s on s.id = t.school_id
 where t.template_key = 'tour_invitation_email'
   and t.is_active
   and coalesce(btrim(s.tour_booking_url), '') <> ''
   and t.body like '%{{tour_link}}%'

 order by campus;
