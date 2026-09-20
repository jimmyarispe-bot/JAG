-- 278: four more HS students who are not enrolled for 2026-27.
--
-- Jimmy, 2026-09-06: "not enrolled Israel Cooks, Andrew Gosink, Luke Matteo,
-- mackenzie shanklin."
--
-- Same archive path as 277 and, before it, 188 / 258 / 268: status archived,
-- previous_status kept, nothing deleted.
--
-- ISRAEL COOKS NEEDS A SECOND LOOK AFTER THIS.
-- He is on the Georgia Special Needs Scholarship roster — migration 267 renamed
-- him from Josiah to Israel precisely because the state roster spells it that
-- way. He was never a GA campus student; he sat at The Academy HS. Now he is
-- not enrolled anywhere. That is the same shape as the $39,477 problem raised
-- on 4 September: state money filed against a child who is gone. Reported at
-- the bottom, not fixed here — the fix is in the Georgia portal, not in JAG.
--
-- He also carries THREE sis_enrollments rows (two academy_hs on the Traditional
-- year, one academy_virtual on the Year-Round year). Archiving the student
-- takes him out of every billing pass, so the duplicate is no longer a billing
-- risk. It is left in place rather than deleted, because a duplicate row is
-- evidence of how it happened and deleting it destroys that.
--
-- RUN 277 FIRST. This migration stands on its own and is safe in either order,
-- but the headcounts at the bottom assume 277 has already committed.
--
-- IDEMPOTENT.

begin;

create temp table hs_archive_2 (first_name text, last_name text) on commit drop;

insert into hs_archive_2 values
  ('Israel',    'Cooks'),
  ('Andrew',    'Gosink'),
  ('Luke',      'Matteo'),
  ('Mackenzie', 'Shanklin');

do $$
declare
  r          record;
  v_id       uuid;
  v_hits     int;
  v_archived int := 0;
  v_already  int := 0;
  v_missing  text[] := '{}';
begin
  for r in select * from hs_archive_2 loop

    -- Andrew Gosink and Andrew Ribeiro share a first name; Mackenzie Shanklin
    -- and Mackenzie Morris share one too, across two schools. Both halves of
    -- the name are matched, and two hits still abort.
    select count(*) into v_hits
      from public.students s
      join public.schools sc on sc.id = s.school_id
     where lower(s.first_name) = lower(r.first_name)
       and lower(s.last_name)  = lower(r.last_name)
       and (sc.name ilike '%academy hs%' or sc.name ilike '%academy virtual%');

    if v_hits > 1 then
      raise exception 'Aborting: % % matches % students at HS/Virtual. Too ambiguous to archive.',
        r.first_name, r.last_name, v_hits;
    end if;

    select s.id into v_id
      from public.students s
      join public.schools sc on sc.id = s.school_id
     where lower(s.first_name) = lower(r.first_name)
       and lower(s.last_name)  = lower(r.last_name)
       and (sc.name ilike '%academy hs%' or sc.name ilike '%academy virtual%')
       and s.status = 'active';

    if v_id is null then
      if v_hits = 1 then
        v_already := v_already + 1;
      else
        v_missing := array_append(v_missing, r.first_name || ' ' || r.last_name);
      end if;
    else
      update public.students s
         set previous_status = coalesce(s.previous_status, s.status),
             status          = 'archived',
             archived_at     = now()
       where s.id = v_id;
      v_archived := v_archived + 1;
    end if;
  end loop;

  raise notice '% archived, % already archived.', v_archived, v_already;
  if array_length(v_missing, 1) is not null then
    raise notice 'NOT FOUND: %', array_to_string(v_missing, ', ');
  end if;
end $$;

-- Israel Cooks against the Georgia roster. Any live award row here is state
-- money attached to a child who is no longer a student.
--
-- The award row is emitted as jsonb rather than named columns. This migration
-- has never read scholarship_awards, and guessing a column name would turn a
-- report into a failed migration. to_regclass guards the table itself.
do $$
declare v_row record; v_found boolean := false;
begin
  if to_regclass('public.scholarship_awards') is null then
    raise notice 'No scholarship_awards table. Check Israel Cooks in the Georgia portal by hand.';
    return;
  end if;
  for v_row in
    execute $q$
      select s.first_name || ' ' || s.last_name as student, s.status, to_jsonb(a) as award
      from public.students s
      join public.scholarship_awards a on a.student_id = s.id
      where lower(s.last_name) = 'cooks'
    $q$
  loop
    v_found := true;
    raise notice 'CHECK THE GEORGIA PORTAL — % (%) has an award on file: %',
      v_row.student, v_row.status, v_row.award;
  end loop;
  if not v_found then
    raise notice 'Israel Cooks has no scholarship_awards row in JAG. The Georgia portal may still carry one — check it there.';
  end if;
end $$;

-- Headcounts. With 277 and 278 both committed: HS 13, Virtual 14.
select sc.name as school, count(*) as active_students
from public.students s
join public.schools sc on sc.id = s.school_id
where s.status = 'active'
  and (sc.name ilike '%academy hs%' or sc.name ilike '%academy virtual%')
group by sc.name
order by sc.name;

commit;
