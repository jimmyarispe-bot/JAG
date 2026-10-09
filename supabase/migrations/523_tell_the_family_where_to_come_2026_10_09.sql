-- 523_tell_the_family_where_to_come_2026_10_09.sql
--
-- Candace Martin, 11:21am on 9 October 2026, in the first letter The JAG ever
-- really sent a family:
--
--     Campus: Main Campus
--     Directions: See portal for directions
--
-- She is driving to a tour on Monday 19 October and there is no portal.
--
-- THREE THINGS WERE WRONG, NOT ONE
--
-- 1. No campus row holds an address. All six are null.
-- 2. No tour booking records a campus. Every tour ever booked - Candace
--    Martin, Ian Xavier Matos Ortiz, Jayden Roy - has campus_id null, so
--    campus_name and campus_address resolved to nothing.
-- 3. merge-fields.ts filled that nothing with the strings "Main Campus" and
--    "See portal for directions", which read like answers and are not.
--
-- The code half of the fix is in the same commit: the schools projection now
-- fetches address, engine.ts falls back to the school's address on BOTH the
-- single-lead and the batch path - the batch one is what renders Candace's
-- reminder on 18 October - and merge-fields no longer invents a portal.
--
-- This is the data half.

begin;

-- ============================================================================
-- PART 1 - WHERE THE SCHOOLS ACTUALLY ARE
-- ============================================================================
--
-- Jimmy, 9 October. Both campus rows per school get the building: a hybrid or
-- part-virtual student still drives to the same door.
--
-- THE WAYFINDING IS PART OF THE ADDRESS, not a separate line. The revised
-- template has one Address field and no Directions field, so "in the back of
-- the church, at the awning" has to travel with the address or it is lost -
-- and it is the part that actually gets a parent to the right entrance.

update public.campuses
   set address = '1420 Southeast Floresta Drive, Port Saint Lucie, Florida 34983 — in the back of the church, at the awning',
       updated_at = now()
 where id in (
   'c1000000-0000-4000-8000-000000000001',  -- Academy FL Campus
   'c1000000-0000-4000-8000-000000000002'   -- Academy FL Virtual
 );

update public.campuses
   set address = '300 Village Green Circle SE, Suite 201B, Smyrna, GA 30080 — upstairs on the 2nd floor',
       updated_at = now()
 where id in (
   'c1000000-0000-4000-8000-000000000003',  -- Academy GA Campus
   'c1000000-0000-4000-8000-000000000004'   -- Academy GA Hybrid
 );

/*
 * THE SAME ADDRESS ON THE SCHOOL, because that is what the new fallback
 * reads when a booking names no campus - which is every booking so far.
 *
 * schools.address held "Florida, USA" and "Georgia, USA". Those are not
 * addresses; they are worse than blank, because they render as though the
 * question was answered.
 */
update public.schools
   set address = '1420 Southeast Floresta Drive, Port Saint Lucie, Florida 34983 — in the back of the church, at the awning'
 where name = 'The Academy FL';

update public.schools
   set address = '300 Village Green Circle SE, Suite 201B, Smyrna, GA 30080 — upstairs on the 2nd floor'
 where name = 'The Academy GA';

/*
 * HS AND VIRTUAL ARE LEFT ALONE ON PURPOSE. Jimmy, 9 October: "hs n virtual
 * don't have an address and doesn't schedule tours". Writing a placeholder
 * there would be the same mistake as "Georgia, USA". They stay as they are,
 * and the fact that neither schedules tours wants a guard of its own - the
 * tour letter should not be reachable for a school with no building. Not in
 * this file; it is a code change and it is not urgent, because no tour has
 * ever been booked at either.
 */

-- ============================================================================
-- PART 2 - THE TWO TOURS THAT ARE ACTUALLY COMING
-- ============================================================================
--
-- Candace Martin, Monday 19 October 9:00am. Ian Xavier Matos Ortiz,
-- Thursday 22 October 9:00am. Both The Academy GA, both with campus_id null.
--
-- The fallback added in the same commit would cover them anyway, through the
-- school address. They are pinned to the campus regardless, because the
-- fallback is a safety net and a booking that records where it is happening
-- is the thing the net is there to catch. Jayden Roy's tour was 23 September
-- and is left alone.

update public.admissions_tours t
   set campus_id = 'c1000000-0000-4000-8000-000000000003'   -- Academy GA Campus
  from public.admissions_leads l
 where l.id = t.lead_id
   and t.campus_id is null
   and t.scheduled_at > now()
   and l.school_id = (select id from public.schools where name = 'The Academy GA');

-- ============================================================================
-- PART 3 - THE LETTER, IN JIMMY'S WORDS
-- ============================================================================
--
-- His revision, 9 October, verbatim in shape: Campus, Directions and Parking
-- are gone and replaced by one Address line. {{campus_name}} is out of the
-- subject too - it was the field producing "Main Campus" - and {{school_name}}
-- takes its place, which gives "The Academy GA".
--
-- THE GREETING WAS NEVER WRONG. {{guardian_first_name}} and {{student_name}}
-- are different fields and always were. Candace's letter said "Dear Candace"
-- and "Candace's learning needs" because on that lead the guardian and the
-- student are both recorded as Candace Martin - her mother typed her own name
-- into the child's name box. That is a phone call, not a template change.

update public.admissions_communication_templates
   set subject = 'Tour confirmed — {{student_name}} at {{school_name}}',
       body = 'Dear {{guardian_first_name}},

Your campus tour is confirmed:

Date/Time: {{tour_datetime}}
Address: {{campus_address}}

What to expect: Meet our admissions team, tour classrooms, and discuss {{student_name}}''s learning needs.

Calendar invite attached.

{{school_name}} Admissions',
       updated_at = now()
 where template_key = 'tour_confirmation_email';

commit;

-- ============================================================================
-- WHAT CANDACE'S REMINDER WILL SAY ON 18 OCTOBER
-- ============================================================================
--
--   Subject: Tour confirmed — Candace at The Academy GA
--
--   Dear Candace,
--
--   Your campus tour is confirmed:
--
--   Date/Time: Monday, October 19, 2026 @ 9:00 AM
--   Address: 300 Village Green Circle SE, Suite 201B, Smyrna, GA 30080 —
--            upstairs on the 2nd floor
--
--   What to expect: Meet our admissions team, tour classrooms, and discuss
--   Candace's learning needs.
--
--   Calendar invite attached.
--
--   The Academy GA Admissions
--
-- "Dear Candace" is still there, and it is still the data. Ring her on
-- 770 235 5512 and find out the child's name before the 18th.
--
-- STILL UNVERIFIED: "Calendar invite attached." I have not confirmed the JAG
-- attaches an .ics. If it does not, that line tells a parent something untrue
-- and should come out. Worth checking before the 18th as well.
