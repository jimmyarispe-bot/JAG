-- Life Lab and Real World Math get the standard rate.
--
-- Jimmy, 20 September 2026: "everything except structured literacy is the same
-- class rate. both in hs and virtual."
--
-- So: 20.00 for the first enrolled student, 5.00 for each one beyond, and a
-- guest teacher covering somebody else's class starts at 15.00. Structured
-- Literacy alone is different, at 35.00 and 30.00.
--
-- THIS IS A RULE, NOT TWO ROWS. Every course this network adds from here takes
-- these numbers unless it is Structured Literacy. Worth writing down, because
-- the six sections below sat unpayable for a day purely because nobody had said
-- the obvious thing out loud - Marnie Witters' entire teaching load was in that
-- state until yesterday evening.
--
-- WHO THIS PAYS. Craig Mann's three Life Labs at 09:00, 10:00 and 11:00, and
-- Real World Math for Peter Alouise at 09:00 and 12:00 and Raven Rogers at
-- 14:00. Six of the 41 sections - the last unpriced classes on the schedule.
--
-- TUTORING IS LEFT ALONE HERE, DELIBERATELY. It currently pays a flat 20.00
-- with 0.00 per additional student, set when Jimmy said "the tutoring rate is
-- the 1st student rate for regular classes". Today's rule could mean it should
-- also add 5.00 a head. Every tutoring slot on this schedule is one-to-one so
-- nothing turns on it yet, and Craig Mann's personal 30.00 tutoring rate sits
-- on the same footing - changing one without the other would leave the pair
-- inconsistent. Asked, not assumed.

begin;

insert into public.class_pay_rates
  (course_id, employee_id, base_first_student, per_additional_student,
   guest_base_first_student, effective_from)
select c.id, null, 20.00, 5.00, 15.00, date '2026-09-01'
from public.courses c
where c.code in ('LIFELAB', 'RWMATH')
on conflict (course_id, effective_from) where employee_id is null do update
  set base_first_student       = excluded.base_first_student,
      per_additional_student   = excluded.per_additional_student,
      guest_base_first_student = excluded.guest_base_first_student,
      updated_at               = now();

commit;

-- =========================================================================
-- THE REPORT
-- =========================================================================
--
-- EVERY SECTION ON THE SCHEDULE SHOULD NOW READ 'rate set' - 41 of 41, no
-- exceptions. This is the first moment in this project at which every class a
-- teacher holds can be priced.
--
-- Structured Literacy must stand alone at 35.00. Everything else reads 20.00,
-- except Tutoring's flat 20.00/0.00, which is the open question.

select case when r.id is null then 'NO RATE' else 'rate set' end as status,
       c.name as course,
       sch.name as books_to,
       count(*) as sections,
       min(r.base_first_student) as base,
       min(r.per_additional_student) as per_extra,
       min(r.guest_base_first_student) as guest
from public.course_sections sec
join public.courses c on c.id = sec.course_id
join public.schools sch on sch.id = c.school_id
left join public.class_pay_rates r on r.course_id = c.id and r.employee_id is null
where sec.meeting_pattern->>'source' like 'Fall 2026-2027 Virtual%'
group by (r.id is null), c.name, sch.name
order by (r.id is null) desc, c.name;
