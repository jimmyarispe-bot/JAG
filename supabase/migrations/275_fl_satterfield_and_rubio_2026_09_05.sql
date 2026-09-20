-- 275: The Academy FL — archive Satterfield, correct the Rubio spelling.
--
-- Jimmy, 2026-09-05: "disregard satterfield."
--
-- Kaitlyn Satterfield is active at The Academy FL, on no Step Up roster row and
-- with no 26-27 schedule. The FL equivalent of Tori Rice at GA. Archived, not
-- deleted.
--
-- And Cristian Rubio: JAG spells him CHRISTIAN, the Step Up roster spells him
-- CRISTIAN. Same child — same guardian (Audrey Rubio), same family as
-- Alexandra, paid 2,792.50. The roster is the naming standard, as it was for GA.
--
-- The roster also has him in 2nd grade against JAG's 1st. Grade is NOT changed
-- here: a scholarship roster is authoritative about a child's name and award,
-- not about which classroom he sits in. Flagged instead.
--
-- IDEMPOTENT.

begin;

do $$
declare v_hit int;
begin
  update public.students s
     set previous_status = coalesce(s.previous_status, s.status),
         status          = 'archived',
         archived_at     = now()
    from public.schools sc
   where sc.id = s.school_id
     and (sc.name ilike '%academy%fl%' or sc.name ilike '%academy florida%')
     and lower(s.last_name) like 'satterfield%'
     and s.status <> 'archived';
  get diagnostics v_hit = row_count;
  raise notice 'Satterfield: % archived.', v_hit;

  update public.students s
     set first_name = 'Cristian'
   where lower(s.last_name) = 'rubio'
     and lower(s.first_name) = 'christian';
  get diagnostics v_hit = row_count;
  raise notice 'Rubio: % renamed Christian -> Cristian.', v_hit;
end $$;

-- Grade disagreement, reported not changed.
select 'GRADE DIFFERS FROM ROSTER' as note,
       s.first_name || ' ' || s.last_name as student,
       s.grade_level as jag_grade,
       '2nd_grade (Step Up roster)' as roster_grade
from public.students s
where lower(s.last_name) = 'rubio' and lower(s.first_name) = 'cristian';

-- The Academy FL should now read 32 active — an exact match to the 32 current
-- campus students on the Step Up roster.
select count(*) as active_fl_students
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%fl%' or sc.name ilike '%academy florida%')
  and s.status = 'active';

commit;
