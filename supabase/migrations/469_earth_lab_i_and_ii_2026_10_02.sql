-- 469_earth_lab_i_and_ii_2026_10_02.sql
--
-- Jimmy, 2 October 2026: "add Earth Lab 1 and Earth Lab II to the list of
-- classes every teacher sees and has as options pls"
--
-- Sixteen classes now, not fourteen.
--
--   15. Earth Lab I    $20 first student, $5 each after, everybody
--   16. Earth Lab II   $20 first student, $5 each after, everybody
--
-- THE SPELLING WAS ASKED ABOUT RATHER THAN TIDIED. Jimmy wrote "Earth Lab 1"
-- and "Earth Lab II" - one Arabic, one Roman - and confirmed Roman for both,
-- matching Life Lab I / Life Lab II and Entrepreneurship I / Entrepreneurship
-- II. The class names are his and are not changed on anyone else's judgement;
-- where they look inconsistent the answer is to ask, not to correct.
--
-- EARTHOLOGY IS UNTOUCHED. It remains class 4 and keeps its code. These two
-- are additional, not a rename of it - "add" was the word.
--
-- RESTRICTED IS FALSE, so these appear for all thirteen teachers with no
-- grant row needed. Only Structured Literacy, its 1:1 form and Craig & Ivy
-- are restricted, and this does not touch any of them.
--
-- SORT ORDER 15 AND 16 puts them at the end of the picker rather than
-- reshuffling a list teachers have already started learning.
--
-- Everything below mirrors 463 exactly: the same school, the same match by
-- CODE rather than by name, the same upsert. Safe to re-run.

begin;

do $$
declare
  v_school uuid;
  v_course uuid;
  r record;
begin
  select id into v_school from public.schools where name = 'The Academy Virtual' limit 1;
  if v_school is null then
    raise exception 'No school named The Academy Virtual - cannot file the course rows.';
  end if;

  for r in
    select * from (values
      (15, 'Earth Lab I',  'JAG-EARTH-LAB-1', 2000, 500, false),
      (16, 'Earth Lab II', 'JAG-EARTH-LAB-2', 2000, 500, false)
    ) as t(pos, cname, ccode, base, per_add, restricted)
  loop
    /* By CODE, not by name - the same reason as 463: two courses may
       legitimately share a name across schools. */
    select id into v_course
      from public.courses
     where school_id = v_school and code = r.ccode
     limit 1;

    if v_course is null then
      insert into public.courses (school_id, code, name, status)
      values (v_school, r.ccode, r.cname, 'active')
      returning id into v_course;
      raise notice 'Created %', r.cname;
    else
      update public.courses set name = r.cname, status = 'active', updated_at = now()
       where id = v_course;
      raise notice 'Already there, name re-set to %', r.cname;
    end if;

    insert into public.teacher_pay_courses
      (course_id, base_cents, per_additional_cents, restricted, sort_order)
    values (v_course, r.base, r.per_add, r.restricted, r.pos)
    on conflict (course_id) do update
      set base_cents           = excluded.base_cents,
          per_additional_cents = excluded.per_additional_cents,
          restricted           = excluded.restricted,
          sort_order           = excluded.sort_order;
  end loop;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT sixteen rows, in picker order.
--
-- Earth Lab I and Earth Lab II at 15 and 16, $20.00 / $5.00, "everybody".
-- The three restricted ones unchanged: 1:1 Tutoring Structured Literacy,
-- 1:1 Tutoring Craig & Ivy, Structured Literacy.

select tpc.sort_order                                as pos,
       c.name                                        as class_name,
       c.code,
       '$' || to_char(tpc.base_cents / 100.0, 'FM999990.00')           as first_student,
       '$' || to_char(tpc.per_additional_cents / 100.0, 'FM999990.00') as each_after,
       case when tpc.restricted then 'named teachers only' else 'everybody' end
                                                     as who_sees_it
  from public.teacher_pay_courses tpc
  join public.courses c on c.id = tpc.course_id
 order by tpc.sort_order;
