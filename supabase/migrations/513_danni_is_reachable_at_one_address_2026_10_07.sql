-- ==========================================================================
-- 513 — DANNI IS REACHABLE AT ONE ADDRESS
--
-- 7 October 2026. Run top to bottom in the Supabase SQL editor.
-- The last statement is a verification SELECT. Read it before you leave.
--
-- ── WHAT IS WRONG ─────────────────────────────────────────────────────────
--
-- The booking scan lists every calendar the JAG's Google connection can read
-- and compares that list against school_admissions_contacts.email for each
-- campus's booking contact. Today it reads:
--
--     thejagcalendar@theacademyway.org
--     nina.gaddy@theacademyga.org
--     heather.brown@theacademyway.org
--     danni.treu@theacademyway.org        <- shared 7 October
--
-- and The Academy FL's booking contact is stored as
--
--     danni.treu@theacademyfl.org
--
-- Two addresses for one person. The calendar is readable and the campus is
-- still reported as having none, because the two strings do not match.
--
-- The share itself worked, and worked immediately: bookingsSeen went from
-- 128 to 204 in the same hour, and the scan found an upcoming FL booking on
-- Monday 12 October at 11:00 AM that it had never been able to see.
--
-- ── WHAT THIS CHANGES, AND WHAT ELSE MOVES WITH IT ────────────────────────
--
-- school_admissions_contacts.email is ONE column doing TWO jobs: it is the
-- address the calendar check matches on, AND the address FL's staff letters
-- are sent to. This week's staff_interest_link_not_sent letters went to
-- danni.treu@theacademyfl.org.
--
-- So this migration does not only fix a calendar check. It MOVES DANNI'S
-- ADMISSIONS MAIL to danni.treu@theacademyway.org. Jimmy chose that on
-- 7 October, having been told so in those words.
--
-- Nothing else is touched. Her name, her telephone number, her booking URL
-- and her notification flag all stay exactly as they are.
--
-- Idempotent. Safe to re-run — the second run updates nothing and the
-- assertions still pass.
-- ==========================================================================

begin;

-- 1 ------------------------------------------------- REFUSE A COLLISION FIRST
-- (school_id, email) is unique. If a second row already exists at The Academy
-- FL carrying the new address, this update would fail halfway with a
-- constraint error rather than a sentence. Say so instead.
do $$
declare
  fl uuid;
  clash int;
begin
  select id into fl from public.schools
  where lower(trim(name)) = 'the academy fl';

  if fl is null then
    raise exception '513: no school named The Academy FL';
  end if;

  select count(*) into clash
  from public.school_admissions_contacts
  where school_id = fl
    and lower(trim(email)) = 'danni.treu@theacademyway.org';

  if clash > 0 then
    raise exception
      '513: The Academy FL already has a contact at danni.treu@theacademyway.org. '
      'Two rows for one person is a separate decision — stopping rather than merging them.';
  end if;
end $$;

-- 2 ------------------------------------------------------- THE ONE ROW
update public.school_admissions_contacts c
set email = 'danni.treu@theacademyway.org'
from public.schools s
where s.id = c.school_id
  and lower(trim(s.name)) = 'the academy fl'
  and lower(trim(c.email)) = 'danni.treu@theacademyfl.org';

-- 3 -------------------------------------------------- ASSERT, THEN COMMIT
-- Exactly one booking contact at FL, carrying the address the calendar list
-- actually returns, and no row left on the old one.
do $$
declare
  good int;
  stale int;
begin
  select count(*) into good
  from public.school_admissions_contacts c
  join public.schools s on s.id = c.school_id
  where lower(trim(s.name)) = 'the academy fl'
    and c.is_booking_contact
    and lower(trim(c.email)) = 'danni.treu@theacademyway.org';

  if good <> 1 then
    raise exception
      '513: expected exactly 1 FL booking contact at danni.treu@theacademyway.org, found %',
      good;
  end if;

  select count(*) into stale
  from public.school_admissions_contacts
  where lower(trim(email)) = 'danni.treu@theacademyfl.org';

  if stale <> 0 then
    raise exception
      '513: % row(s) still carry danni.treu@theacademyfl.org', stale;
  end if;
end $$;

commit;

-- 4 ------------------------------------------------------------- SEE IT DONE
-- Every admissions contact at every campus. The booking contact's address is
-- what the calendar check matches on, so "calendar seen by the scan" should
-- now read OK for all four.
select
  s.name                                                   as campus,
  c.name                                                   as person,
  c.email                                                  as email,
  case when c.is_booking_contact then 'booking contact'
       else '—' end                                        as role,
  case when c.receives_notifications then 'gets mail'
       else 'no mail' end                                  as mail,
  case
    when not c.is_booking_contact then '—'
    when lower(trim(c.email)) in (
           'thejagcalendar@theacademyway.org',
           'nina.gaddy@theacademyga.org',
           'heather.brown@theacademyway.org',
           'danni.treu@theacademyway.org'
         ) then 'OK — the scan can read this calendar'
    else 'NOT IN THE SCAN''S CALENDAR LIST — this campus is invisible'
  end                                                      as calendar_seen_by_the_scan
from public.school_admissions_contacts c
join public.schools s on s.id = c.school_id
where c.is_active
order by s.name, c.is_booking_contact desc, c.name;
