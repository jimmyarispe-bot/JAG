-- FLORIDA HAS PEOPLE: DANNI AND JIMMY
--
-- 30 September 2026. The previous operation reported that The Academy FL has
-- no admissions contact recorded anywhere, so Jimmy would become its only
-- recipient. Jimmy: "fl is danni and me".
--
-- DANNI IS RESOLVED FROM THE USERS TABLE, NOT TYPED IN. Her address is not
-- something to guess at, and an address invented in a migration is an
-- inquiry that goes nowhere. If exactly one JAG user does not match, nothing
-- is written and the exception says so.
--
-- SHE IS THE BOOKING CONTACT, Jimmy is notifications only - the same shape as
-- every other campus, where the leader's calendar is the one a parent books
-- and nobody is sent to Jimmy's.
--
-- WHAT THIS DOES NOT FIX, and the verify below will show it: a booking
-- contact with no booking_url. merge-fields renders an absent link as an
-- EMPTY STRING, so a template that says "pick a time by clicking the
-- following link" mails a parent that sentence and nothing after it. That is
-- what happened to Jessica Davis at 8:32 this morning - Cayden's shadow day
-- email said "Please use this link" and carried no link, because
-- shadow_days_url is not set on that campus. Setting a URL is a decision
-- about a real calendar and nobody has given me one.
--
-- Safe to re-run.

begin;

do $$
declare
  v_jimmy   text := 'jimmy.arispe@theacademyway.org';
  v_fl      uuid;
  v_danni   text;
  v_dname   text;
  v_n       integer;
begin

  select id into v_fl from public.schools where name = 'The Academy FL';
  if v_fl is null then
    raise exception 'No school named exactly "The Academy FL". Nothing written.';
  end if;

  -- ---------------------------------------------------------------------
  -- 1. Danni, from the users table. Exactly one, or stop.
  -- ---------------------------------------------------------------------
  select count(*) into v_n from public.users u
   where lower(u.full_name) like '%danni%';
  if v_n <> 1 then
    raise exception
      'Expected exactly ONE JAG user matching "danni", found %. Nothing '
      'written - tell me her address and this becomes one line.', v_n;
  end if;

  select u.email, u.full_name into v_danni, v_dname
    from public.users u where lower(u.full_name) like '%danni%';

  if coalesce(trim(v_danni), '') = '' then
    raise exception 'The user matching "danni" has no email address. Nothing written.';
  end if;

  -- ---------------------------------------------------------------------
  -- 2. Danni: notified, and the booking contact.
  -- ---------------------------------------------------------------------
  insert into public.school_admissions_contacts
    (school_id, name, email, receives_notifications, is_booking_contact, is_active)
  values (v_fl, v_dname, trim(v_danni), true, true, true)
  on conflict (school_id, email) do update
    set receives_notifications = true,
        is_booking_contact     = true,
        is_active              = true,
        updated_at             = now();

  -- ---------------------------------------------------------------------
  -- 3. Jimmy: notified only. Idempotent with the operation before this one.
  -- ---------------------------------------------------------------------
  insert into public.school_admissions_contacts
    (school_id, name, email, receives_notifications, is_booking_contact, is_active)
  values (v_fl, 'Jimmy Arispe', v_jimmy, true, false, true)
  on conflict (school_id, email) do update
    set receives_notifications = true,
        is_booking_contact     = false,
        is_active              = true,
        updated_at             = now();

  raise notice 'FL: % is the booking contact, Jimmy is notified.', v_dname;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every campus, everybody it tells, and the two URLs that decide whether the
-- emails those people trigger actually carry a link.
--
-- A BOOKING row with no booking_url sends a parent "pick a time by clicking
-- the following link" followed by nothing. An empty shadow_days_url is what
-- reached Jessica Davis this morning.

select s.name                                           as campus,
       c.name                                           as contact,
       c.email                                          as email,
       case when c.is_booking_contact then 'BOOKING' else 'notified' end as role,
       coalesce(c.booking_url, s.admissions_booking_url, '** NO BOOKING URL **') as books_at,
       coalesce(s.shadow_days_url, '** NO SHADOW DAY URL **')            as shadow_days
  from public.schools s
  left join public.school_admissions_contacts c
    on c.school_id = s.id and c.is_active
 order by s.name, c.is_booking_contact desc nulls last, c.email;
