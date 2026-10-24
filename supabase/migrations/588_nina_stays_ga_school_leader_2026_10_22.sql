-- 585: Nina Gaddy stays The Academy GA's school leader. Jimmy takes admissions only.
--
-- Jimmy, 22 October 2026: "Leave nina gaddy as the academy ga school leader.
-- Im only taking over admissions right now."
--
-- Earlier on the 22nd the GA row was switched to Jimmy on BOTH sides: the
-- admissions contact (right) and school_leader_bcc_email (wrong - that column
-- is the school leader, and it is also the name the "we have received
-- everything" letter prints and copies as the leader).
--
-- CHANGES: school_leader_bcc_email back to Nina.
-- DOES NOT CHANGE: admissions_contact_*, admissions_from_email, booking links,
-- school_admissions_contacts - admissions is Jimmy's. Nina's SCHOOL_LEADER role
-- and her GA campus were never touched and are not touched here.

update public.schools
set school_leader_bcc_email = 'nina.gaddy@theacademyga.org',
    updated_at = now()
where id = 'a1000000-0000-4000-8000-000000000002';  -- The Academy GA

-- Check: expect leader nina.gaddy@..., admissions jimmy.arispe@...
select name, school_leader_bcc_email, admissions_contact_email, admissions_from_email
from public.schools
where id = 'a1000000-0000-4000-8000-000000000002';
