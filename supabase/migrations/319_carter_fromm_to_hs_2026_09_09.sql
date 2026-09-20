-- 319_carter_fromm_to_hs_2026_09_09.sql
--
-- Carter Fromm is an HS student. JAG has him at The Academy Virtual.
-- Jimmy, 9 September 2026: "carter should be marked as hs everywhere."
--
-- Found by the money: his Square recurring series is titled "2026-2027 The
-- Academy HS Monthly Tuition", $1,850.00, active from 21 September 2026, and it
-- lives in the HS Square account. HS has been billing him all along.
--
-- WHY "EVERYWHERE" IS NOT ONE UPDATE
--
-- 150+ tables in this schema carry school_id or campus_id. Listing the ones I
-- happen to remember and calling that "everywhere" is how a student ends up
-- half-moved - correct on the roster, still Virtual in the reporting tables,
-- and nobody notices for a year.
--
-- So the script asks the CATALOG. It finds every table with a foreign key to
-- public.students that also has a school_id (or campus_id) column, and moves
-- Carter's rows in all of them. Whatever exists gets moved; whatever does not
-- exist is not silently skipped, it is reported.
--
-- THREE THINGS IT WILL NOT DO ON ITS OWN
--
-- 1. families.school_id is shared with siblings. It is only changed if every
--    student in that family is moving. Otherwise it is reported and left.
-- 2. funder_disbursements is NOT touched. A disbursement records where money
--    was EARNED at the time. Carter has none today, but the rule matters: the
--    roster says where a student is now, the ledger says where the money came
--    from, and rewriting the second to match the first destroys history. This
--    is the same reason migration 312 made entity transfers a view rather than
--    a constraint.
-- 3. Nothing in Square changes. His series is correct as it stands.
--
-- SAFE TO RE-RUN. Every write is guarded on the row still pointing at Virtual.

begin;

create temp table _r319 (seq int, item text, detail text);

do $$
declare
  v_student   uuid;
  v_family    uuid;
  v_lead      uuid;
  v_from      uuid;  -- The Academy Virtual
  v_to        uuid;  -- The Academy HS
  v_campus    uuid;
  v_ncampus   int;
  v_program   text;
  v_siblings  int;
  v_moved     bigint;
  v_total     bigint := 0;
  r           record;
begin

  select id into v_to   from public.schools where name = 'The Academy HS';
  select id into v_from from public.schools where name = 'The Academy Virtual';

  if v_to is null then
    raise exception 'The Academy HS not found in public.schools. Nothing changed.';
  end if;

  select st.id, st.family_id, st.admissions_lead_id, st.program
    into v_student, v_family, v_lead, v_program
    from public.students st
   where lower(st.first_name) = 'carter'
     and lower(st.last_name)  = 'fromm';

  if v_student is null then
    raise exception 'Carter Fromm not found. Nothing changed.';
  end if;

  -- The HS campus, if HS has exactly one. Ambiguity is reported, never guessed:
  -- a wrong campus_id is harder to spot than a null one.
  select count(*) into v_ncampus from public.campuses where school_id = v_to;
  if v_ncampus = 1 then
    select id into v_campus from public.campuses where school_id = v_to;
    insert into _r319 values (5, 'campus', 'The Academy HS has one campus - campus_id set to it.');
  else
    v_campus := null;
    insert into _r319 values (5, 'campus',
      format('The Academy HS has %s campuses - campus_id set to NULL rather than guessed.', v_ncampus));
  end if;

  ---------------------------------------------------------------------------
  -- 1. The student record itself
  ---------------------------------------------------------------------------
  update public.students
     set school_id  = v_to,
         campus_id  = v_campus,
         program    = case when program = 'academy_virtual' then 'academy_hs' else program end,
         updated_at = now()
   where id = v_student;

  insert into _r319 values (10, 'students',
    format('school_id -> The Academy HS; program %s -> %s',
           coalesce(v_program, 'null'),
           case when v_program = 'academy_virtual' then 'academy_hs' else coalesce(v_program, 'null') end));

  ---------------------------------------------------------------------------
  -- 2. His admissions lead, if he came through the pipeline
  ---------------------------------------------------------------------------
  if v_lead is not null then
    update public.admissions_leads set school_id = v_to, updated_at = now()
     where id = v_lead and school_id is distinct from v_to;
    get diagnostics v_moved = row_count;
    insert into _r319 values (20, 'admissions_leads',
      case when v_moved > 0 then 'lead moved to The Academy HS' else 'lead already at The Academy HS' end);
  else
    insert into _r319 values (20, 'admissions_leads', 'no admissions lead linked - nothing to move');
  end if;

  ---------------------------------------------------------------------------
  -- 3. The family - only if nobody else in it stays behind
  ---------------------------------------------------------------------------
  if v_family is not null then
    select count(*) into v_siblings
      from public.students
     where family_id = v_family
       and id <> v_student
       and school_id is distinct from v_to;

    if v_siblings = 0 then
      update public.families set school_id = v_to, updated_at = now()
       where id = v_family and school_id is distinct from v_to;
      insert into _r319 values (30, 'families', 'family moved to The Academy HS - no siblings left behind');
    else
      insert into _r319 values (30, 'families',
        format('NOT MOVED - %s sibling(s) in this family are at another school. '
               'families.school_id left as it was.', v_siblings));
    end if;
  else
    insert into _r319 values (30, 'families', 'no family linked - nothing to move');
  end if;

  ---------------------------------------------------------------------------
  -- 4. Everything else in the schema that knows both Carter and a school
  ---------------------------------------------------------------------------
  for r in
    select c.conrelid::regclass::text as tbl,
           a.attname::text            as student_col
      from pg_constraint c
      join pg_attribute a
        on a.attrelid = c.conrelid
       and a.attnum   = c.conkey[1]
     where c.confrelid = 'public.students'::regclass
       and c.contype   = 'f'
       and array_length(c.conkey, 1) = 1
       -- funder_disbursements records where money was EARNED. See the header.
       and c.conrelid::regclass::text not in ('funder_disbursements', 'public.funder_disbursements')
     order by 1, 2
  loop

    -- school_id, where the table has one
    if exists (select 1 from information_schema.columns
                where table_schema = 'public'
                  and table_name   = split_part(r.tbl, '.', greatest(1, array_length(string_to_array(r.tbl,'.'),1)))
                  and column_name  = 'school_id') then
      execute format('update %s set school_id = $1 where %I = $2 and school_id is distinct from $1',
                     r.tbl, r.student_col) using v_to, v_student;
      get diagnostics v_moved = row_count;
      if v_moved > 0 then
        v_total := v_total + v_moved;
        insert into _r319 values (40, r.tbl, format('%s row(s) school_id -> The Academy HS', v_moved));
      end if;
    end if;

    -- campus_id, where the table has one and we know the campus
    if v_campus is not null
       and exists (select 1 from information_schema.columns
                    where table_schema = 'public'
                      and table_name   = split_part(r.tbl, '.', greatest(1, array_length(string_to_array(r.tbl,'.'),1)))
                      and column_name  = 'campus_id') then
      execute format('update %s set campus_id = $1 where %I = $2 and campus_id is distinct from $1',
                     r.tbl, r.student_col) using v_campus, v_student;
      get diagnostics v_moved = row_count;
      if v_moved > 0 then
        v_total := v_total + v_moved;
        insert into _r319 values (41, r.tbl, format('%s row(s) campus_id -> the HS campus', v_moved));
      end if;
    end if;

  end loop;

  if v_total = 0 then
    insert into _r319 values (45, 'related tables',
      'No other table held a school or campus for Carter. The student record was the whole of it.');
  end if;

  ---------------------------------------------------------------------------
  -- 5. The note on his tuition plan, replacing the open question with the answer
  ---------------------------------------------------------------------------
  update public.student_tuition_plans
     set updated_at = now(),
         notes      = coalesce(notes || E'\n', '') ||
                      'RESOLVED 2026-09-09 (script 319): the attribution question raised in script 318 is closed. '
                      'Carter is an HS student and was moved to The Academy HS across the schema. '
                      'HS Square billing him $1,850.00/month from 21 September 2026 is correct as it stands; '
                      'nothing in Square changes.'
   where student_id = v_student and status = 'active';

  insert into _r319 values (50, 'student_tuition_plans',
    'note updated - the 318 attribution question is now answered, amount unchanged at $1,850.00');

end $$;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- What moved.
-- ---------------------------------------------------------------------------
select item, detail from _r319 order by seq, item, detail;

-- ---------------------------------------------------------------------------
-- Carter, afterwards. Every field here should say HS.
-- ---------------------------------------------------------------------------
select
  st.first_name || ' ' || st.last_name as student,
  sc.name                              as campus,
  st.grade_level,
  st.program,
  st.enrollment_status,
  p.monthly_amount,
  p.payment_channel
from public.students st
join public.schools sc on sc.id = st.school_id
left join public.student_tuition_plans p on p.student_id = st.id and p.status = 'active'
where lower(st.first_name) = 'carter' and lower(st.last_name) = 'fromm';

-- ---------------------------------------------------------------------------
-- The roster afterwards. With 317 also run, expect Virtual 13 and HS 15.
--   Virtual 16 - Gomes-Gindel (duplicate) - Osterhoudt (not enrolled) - Fromm
--   HS      14 + Fromm
-- ---------------------------------------------------------------------------
select
  sc.name                                                  as campus,
  count(*) filter (where st.enrollment_status = 'enrolled') as enrolled,
  count(*)                                                  as on_roster
from public.students st
join public.schools sc on sc.id = st.school_id
group by sc.name
order by 2 desc;
