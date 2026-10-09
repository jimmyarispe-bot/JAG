-- JIMMY HEARS EVERY INQUIRY, AT EVERY CAMPUS
--
-- 30 September 2026: "for now i want to receive an email notifying me of
-- every inquiry we receive in all schools."
--
-- THE ADDRESS IS jimmy.arispe@theacademyway.org, not the gmail one. Jimmy,
-- 25 September: "why am i getting copies of these to my personal email
-- address? change to jimmy.arispe@theacademyway.org". Say so if that has
-- changed and this is a one-line edit.
--
-- THE TRAP THIS AVOIDS, and it would have been silent.
-- resolveSchoolAdmissionsContacts prefers school_admissions_contacts and falls
-- back to schools.admissions_contact_email ONLY WHEN THE TABLE HAS NO ROWS
-- FOR THAT SCHOOL:
--
--     const rows = ...
--     if (!rows.length) return fallbackContacts;
--
-- So adding Jimmy alone to a campus with no rows stops the table being empty,
-- and from that moment the ONLY person notified is Jimmy. Heather and Nina
-- would stop hearing about their own inquiries and nothing would say so.
--
-- Step 1 therefore seeds each school's CURRENT contact into the table before
-- step 2 adds Jimmy beside them. After this, every campus lists at least two
-- people and the fallback is no longer load-bearing anywhere.
--
-- ONE BOOKING CONTACT PER SCHOOL is enforced by a partial unique index (327).
-- The seeded leader keeps that role and their booking_url; Jimmy is
-- notifications only, is_booking_contact false, so no parent is ever sent to
-- his calendar.
--
-- Safe to re-run: both inserts are keyed on (school_id, email).

begin;

do $$
declare
  v_jimmy text := 'jimmy.arispe@theacademyway.org';
  v_seeded  integer := 0;
  v_added   integer := 0;
  v_orphan  integer := 0;
begin

  -- ---------------------------------------------------------------------
  -- 1. The leader each campus already notifies, written down properly.
  --    Only for schools that have NO rows yet - a campus somebody has
  --    already configured is left exactly as it is.
  -- ---------------------------------------------------------------------
  with bare as (
    select s.id, s.name, s.admissions_contact_name, s.admissions_contact_email,
           s.admissions_booking_url
      from public.schools s
     where coalesce(trim(s.admissions_contact_email), '') <> ''
       and not exists (
         select 1 from public.school_admissions_contacts c
          where c.school_id = s.id and c.is_active
       )
  ), seeded as (
    insert into public.school_admissions_contacts
      (school_id, name, email, receives_notifications, is_booking_contact,
       booking_url, is_active)
    select b.id,
           coalesce(nullif(trim(b.admissions_contact_name), ''), b.name),
           trim(b.admissions_contact_email),
           true, true, b.admissions_booking_url, true
      from bare b
    on conflict (school_id, email) do nothing
    returning 1
  )
  select count(*) into v_seeded from seeded;

  -- ---------------------------------------------------------------------
  -- 2. Jimmy, at every campus. Notifications only.
  -- ---------------------------------------------------------------------
  with added as (
    insert into public.school_admissions_contacts
      (school_id, name, email, receives_notifications, is_booking_contact, is_active)
    select s.id, 'Jimmy Arispe', v_jimmy, true, false, true
      from public.schools s
    on conflict (school_id, email) do update
      set receives_notifications = true,
          is_active = true,
          is_booking_contact = false,
          updated_at = now()
    returning 1
  )
  select count(*) into v_added from added;

  -- ---------------------------------------------------------------------
  -- 3. A campus with no leader at all is named, not skipped quietly. After
  --    this operation its ONLY recipient is Jimmy, which is a real change
  --    and somebody should know.
  -- ---------------------------------------------------------------------
  select count(*) into v_orphan
    from public.schools s
   where not exists (
     select 1 from public.school_admissions_contacts c
      where c.school_id = s.id and c.is_active and c.email <> v_jimmy
   );

  raise notice
    'inquiries: % leader(s) written into the contacts table, Jimmy set on % '
    'campus(es). % campus(es) have NO recipient but Jimmy.',
    v_seeded, v_added, v_orphan;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every campus should list its leader AND Jimmy. A campus showing only Jimmy
-- is one whose leader was never recorded anywhere - fix that before the next
-- inquiry arrives.

select s.name                                   as campus,
       c.name                                   as contact,
       c.email                                  as email,
       case when c.receives_notifications then 'notified' else 'silent' end as notify,
       case when c.is_booking_contact then 'BOOKING' else '' end           as booking
  from public.schools s
  left join public.school_admissions_contacts c
    on c.school_id = s.id and c.is_active
 order by s.name, c.is_booking_contact desc nulls last, c.email;
