-- 268: Olivia Bourgeois is not enrolled for 2026-27.
--
-- She was the only GA student with no scholarship — full pay at 19,950 — which
-- is why she never appeared on the state roster and why I treated her absence
-- there as correct rather than as a discrepancy. Jimmy, 2026-09-05: she is not
-- a current student.
--
-- Reversible: archive, not delete. previous_status is kept.
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
     and (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
     and lower(s.last_name) like 'bourgeois%'
     and lower(s.first_name) like 'oliv%'
     and s.status <> 'archived';

  get diagnostics v_hit = row_count;

  if v_hit = 0 then
    raise notice 'Olivia Bourgeois was already archived, or is not at The Academy GA.';
  else
    raise notice 'Archived % row(s).', v_hit;
  end if;
end $$;

-- Who is left at The Academy GA.
--
-- THIS SHOULD BE 19 — and 19 is now an exact match to the state roster:
-- 21 current students on the roster, less Andrew Ribeiro and Israel Cooks, who
-- are both at The Academy HS holding Georgia awards.
--
-- With Olivia gone there is no longer any GA student who is absent from the
-- state roster. Every child at the campus holds a state scholarship.
select count(*) as active_ga_students
from public.students s
join public.schools sc on sc.id = s.school_id
where (sc.name ilike '%academy%ga%' or sc.name ilike '%academy georgia%')
  and s.status = 'active';

commit;
