-- 267: two GA names settled by the state roster.
--
-- Jimmy, 2026-09-05:
--   Cooks    -> "whatever the state scholarship roster says"  = Israel
--   Alvarado -> "no idea, just use all of them"               = Hernandez Alvarado
--
-- Josiah Cooks is at The Academy HS, not GA — his schedule was filed in the GA
-- folder — so this looks across every school rather than scoping to GA.
--
-- IDEMPOTENT.

begin;

do $$
declare v_hit int;
begin
  -- Josiah -> Israel. The award matches to the dollar (10,712), so this is one
  -- child recorded under two names, not two children.
  update public.students
     set first_name = 'Israel'
   where lower(last_name) = 'cooks'
     and lower(first_name) = 'josiah';
  get diagnostics v_hit = row_count;
  raise notice 'Cooks: % row(s) renamed Josiah -> Israel.', v_hit;

  -- Santiago Hernandez Alvarado. Both surnames kept, as the roster has them.
  update public.students
     set last_name = 'Hernandez Alvarado'
   where lower(first_name) = 'santiago'
     and lower(last_name) = 'alvarado';
  get diagnostics v_hit = row_count;
  raise notice 'Alvarado: % row(s) renamed to Hernandez Alvarado.', v_hit;
end $$;

select s.first_name || ' ' || s.last_name as student,
       sc.name as school, s.status, s.grade_level
from public.students s
left join public.schools sc on sc.id = s.school_id
where lower(s.last_name) like '%cooks%'
   or lower(s.last_name) like '%alvarado%'
order by 1;

commit;
