-- 282: Gabriella Gomes-Gindel is Gabriela Gindel, recorded twice.
--
-- Jimmy, 2026-09-06: "camila gindel only applies to gabriela. not 2 different
-- students." Then, shown both rows: "use the one on top."
--
--   KEEP     8ff091b8-e37e-4081-bed1-0a51770ea2bc  Gabriela Gindel
--   ARCHIVE  ce807924-86c0-45fa-8102-ddfa4663e4d9  Gabriella Gomes-Gindel
--
-- Both active, both 5th grade, both academy_virtual, both under Camila Gindel's
-- single 1,500/month Square series. The series listed two names, which is how
-- one child came to be counted as two.
--
-- THIS ARCHIVES, IT DOES NOT MERGE. Nothing is moved from the duplicate onto
-- the survivor, because a silent merge is how a guardian or a document ends up
-- attached to the wrong child. Instead the migration REPORTS everything the
-- duplicate is carrying — enrolment rows, tuition plans — before archiving it,
-- so anything worth moving is visible and can be moved deliberately.
--
-- The ids are hard-coded from the query Jimmy ran rather than matched on name.
-- Two records this similar are exactly where a name probe picks the wrong one.
--
-- IDEMPOTENT.

begin;

-- What is the duplicate holding? Read this before assuming nothing is lost.
select 'DUPLICATE IS CARRYING' as note,
       (select count(*) from public.sis_enrollments e
         where e.student_id = 'ce807924-86c0-45fa-8102-ddfa4663e4d9') as enrolment_rows,
       (select count(*) from public.student_tuition_plans p
         where p.student_id = 'ce807924-86c0-45fa-8102-ddfa4663e4d9') as tuition_plans;

do $$
declare v_hit int;
begin
  -- Refuse to run if the survivor is not where it is expected to be.
  if not exists (
    select 1 from public.students
     where id = '8ff091b8-e37e-4081-bed1-0a51770ea2bc'
       and lower(first_name) = 'gabriela'
  ) then
    raise exception 'Aborting: 8ff091b8... is not Gabriela Gindel. The ids in this migration are stale.';
  end if;

  update public.students s
     set previous_status = coalesce(s.previous_status, s.status),
         status          = 'archived',
         archived_at     = now()
   where s.id = 'ce807924-86c0-45fa-8102-ddfa4663e4d9'
     and s.status <> 'archived';
  get diagnostics v_hit = row_count;
  raise notice 'Gabriella Gomes-Gindel: % archived.', v_hit;
end $$;

-- Virtual should now read 13.
select sc.name as school, count(*) as active_students
from public.students s
join public.schools sc on sc.id = s.school_id
where s.status = 'active'
  and (sc.name ilike '%academy hs%' or sc.name ilike '%academy virtual%')
group by sc.name
order by sc.name;

commit;
