-- Everything that would have to move with Andrew Ribeiro.
--
-- Jimmy, 27 September: Andrew is Georgia, GA Special Needs only, no parent
-- payments. Under the school-of-record rule his registered school becomes
-- The Academy GA while every class he takes stays at The Academy HS.
--
-- READ BEFORE WRITING. A student is not one row. His family, his tuition
-- plan, his scholarship award and his guardians' campus access can each
-- carry a school_id of their own, and moving the student while they stay
-- behind is how a parent loses sight of their child or a payment lands in
-- the wrong book. This lists what exists so the move can be written against
-- it rather than against my assumptions - three column names have already
-- been guessed wrong on this job tonight.
--
-- ONE statement. Read only.
--
-- THE NUMBER IS THE OTHER HALF. Student numbers are per-campus sequences with
-- a unique index on (school_id, student_number). The last row says whether
-- 000010 is already taken at The Academy GA - if it is, the move is refused
-- until he is renumbered, and if it is not, he keeps a number that reads as
-- though he has been at Georgia since the tenth child enrolled there.

with andrew as (
  select s.id, s.family_id, s.school_id, s.student_number,
         s.first_name || ' ' || s.last_name as name
    from public.students s
   where s.first_name = 'Andrew' and s.last_name = 'Ribeiro'
     and s.status = 'active'
),
ga as (select id from public.schools where lower(trim(name)) = 'the academy ga')

select 'student'::text as row_type,
       a.name as who,
       sc.name as campus_now,
       a.student_number as detail,
       '-'::text as detail_2
  from andrew a join public.schools sc on sc.id = a.school_id

union all

select 'family', f.family_name, sc.name, coalesce(f.billing_email, '-'), f.status
  from andrew a
  join public.families f on f.id = a.family_id
  left join public.schools sc on sc.id = f.school_id

union all

/* A plan carries no school of its own - it hangs off the student, so it
   follows him wherever he is registered. One less thing the move has to
   touch, and worth knowing rather than assuming. */
select 'tuition plan', a.name, 'follows the student',
       coalesce(p.payment_channel, '-'),
       coalesce(p.annual_tuition::text, p.monthly_amount::text, '-')
  from andrew a
  join public.student_tuition_plans p on p.student_id = a.id

union all

select 'scholarship award', a.name, sc.name, aw.program_name, aw.awarded_amount::text
  from andrew a
  join public.scholarship_awards aw on aw.student_id = a.id
  left join public.schools sc on sc.id = aw.school_id

union all

/* Guardians hang off the FAMILY, not off a student_guardians table - there
   is no such table. Their campus access is a user_schools row, which has no
   is_primary column either. Both read from migrations 053 and 022 rather
   than from memory. */
select 'guardian campus access',
       coalesce(u.display_name, u.email, g.first_name || ' ' || g.last_name),
       coalesce(sc.name, 'no campus access row'),
       coalesce(u.email, '-'),
       '-'
  from andrew a
  join public.guardians g on g.family_id = a.family_id
  left join public.users u on u.id = g.user_id
  left join public.user_schools us on us.user_id = g.user_id
  left join public.schools sc on sc.id = us.school_id

union all

select 'class section', a.name, sc.name, c.name, cs.section_code
  from andrew a
  join public.student_enrollments se on se.student_id = a.id
  join public.course_sections cs on cs.id = se.course_section_id
  join public.courses c on c.id = cs.course_id
  left join public.schools sc on sc.id = c.school_id
 where se.enrollment_status = 'enrolled'

union all

select 'IS 000010 TAKEN AT GA?',
       s2.first_name || ' ' || s2.last_name,
       'The Academy GA',
       s2.student_number,
       'renumber him before moving'
  from public.students s2, ga
 where s2.school_id = ga.id
   and s2.student_number = (select student_number from andrew)

order by 1, 2;
