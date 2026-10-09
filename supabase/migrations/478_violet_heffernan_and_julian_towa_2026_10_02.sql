-- 478_violet_heffernan_and_julian_towa_2026_10_02.sql
--
-- Jimmy's updated roll, 2 October 2026 evening. Two children at The Academy
-- Virtual who were not on the morning list:
--
--   Violet Heffernan
--   Julian Towa
--
-- AFTER THIS the roll is FL 35 - GA 22 - HS 11 - AV 12, eighty.
--
-- NO NUMBER IS ASSIGNED HERE, ON PURPOSE. Migration 475 put a trigger on the
-- students table this afternoon precisely so that nothing creating a child
-- has to remember. This file inserts a name and a school and nothing else;
-- if the verify below shows two numbers, the trigger works, and the next
-- import nobody thinks about is covered too.
--
-- That is the test, and it is a real one. 363 backfilled 75 children on 14
-- September and 464 undid it three weeks later, because the fix was a
-- backfill rather than a rule.
--
-- EACH CHILD IS LOOKED FOR BEFORE BEING CREATED, for the reason this morning
-- made obvious. Forty-three children sit inactive; if either of these two is
-- among them, a second row would give one child two records - two numbers,
-- two sets of attendance, and the same name twice in every teacher's grid.
--
--   already active at Virtual  - nothing done
--   on the books but inactive  - reactivated, moved to Virtual if needed,
--                                existing number kept
--   not there at all           - created, and the trigger numbers them
--
-- VIOLET HEFFERNAN IS NOT A DUPLICATE OF COLE HEFFERNAN, who is at The
-- Academy HS. Different first name, different campus, and the search below
-- matches on the whole name - but it is worth saying, because a surname
-- match is exactly the kind of thing that looked like a duplicate this
-- afternoon and was not.
--
-- Safe to re-run.

begin;

do $$
declare
  v_school uuid;
  r        record;
  v_child  uuid;
  v_status text;
  v_num    text;
begin
  select id into v_school from public.schools where name = 'The Academy Virtual' limit 1;
  if v_school is null then
    raise exception 'No school named The Academy Virtual. Nothing changed.';
  end if;

  for r in
    select * from (values
      ('Violet', 'Heffernan'),
      ('Julian', 'Towa')
    ) as t(first_name, last_name)
  loop
    select s.id, coalesce(s.status, '')
      into v_child, v_status
      from public.students s
     where regexp_replace(
             regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                            '\(.*?\)', '', 'g'),
             '[^a-z0-9]', '', 'g')
           = regexp_replace(lower(r.first_name || r.last_name), '[^a-z0-9]', '', 'g')
     limit 1;

    if v_child is not null then
      if v_status = 'active' then
        raise notice '% % is already active. Nothing changed.', r.first_name, r.last_name;
      else
        update public.students
           set status = 'active', school_id = v_school, updated_at = now()
         where id = v_child;
        raise notice '% % was on the books (%). Reactivated at The Academy Virtual.',
          r.first_name, r.last_name, v_status;
      end if;
      v_child := null;
      continue;
    end if;

    /* Name and school only. The trigger from 475 supplies the number. */
    insert into public.students (school_id, first_name, last_name, status)
    values (v_school, r.first_name, r.last_name, 'active')
    returning student_number into v_num;

    raise notice 'Created % % at The Academy Virtual, number % (by the trigger).',
      r.first_name, r.last_name, coalesce(v_num, '*** NONE - the trigger did not fire ***');
  end loop;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT the roll: FL 35 · GA 22 · HS 11 · AV 12, eighty active.
-- And two named rows, each with a number the trigger gave it.

select coalesce(sc.name, '(no school)')                                 as school,
       count(*) filter (where coalesce(s.status,'') = 'active')          as active_children,
       count(*) filter (where coalesce(s.status,'') <> 'active')         as inactive,
       count(*) filter (
         where coalesce(s.status,'') = 'active'
           and nullif(btrim(coalesce(s.student_number,'')), '') is null) as active_without_a_number
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 group by 1
 order by 1;
