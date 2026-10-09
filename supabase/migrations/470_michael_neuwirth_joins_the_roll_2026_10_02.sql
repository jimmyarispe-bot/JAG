-- 470_michael_neuwirth_joins_the_roll_2026_10_02.sql
--
-- Jimmy, 2 October 2026: "add Michael Neuwirth to list of students"
-- Campus confirmed: The Academy Virtual.
--
-- AFTER THIS the roll is FL 35 - GA 22 - HS 11 - AV 10, seventy-eight.
--
-- IT LOOKS FOR HIM BEFORE IT CREATES HIM, and this is the point of the file
-- rather than a nicety. Forty-three children are sitting inactive after the
-- roll of 2 October. If Michael Neuwirth is one of them, creating a second
-- row would give one child two records - two student numbers, two sets of
-- attendance, and a teacher's grid offering his name twice with no way to
-- tell which is which.
--
-- So there are three outcomes and the notice says which happened:
--
--   already active at Virtual  - nothing done
--   on the books but inactive  - reactivated, moved to Virtual if needed,
--                                his existing student number kept
--   not there at all           - created, with the next free number at Virtual
--
-- THE NUMBER IS NEVER REASSIGNED to tidy anything up. A student number is
-- something the office may have written on records, forms and invoices, and
-- changing one to make a database neater is the kind of fix that reappears
-- six months later as a mismatched invoice. The only time a new one is
-- issued is when this child has none.
--
-- The same name normalisation as 464, 465 and 466: case, punctuation and
-- anything in brackets ignored, so "Michael (Mike) Neuwirth " still matches.
--
-- Safe to re-run.

begin;

do $$
declare
  v_school uuid;
  v_child  uuid;
  v_status text;
  v_number text;
  v_at     uuid;
  v_next   bigint;
begin
  select id into v_school from public.schools where name = 'The Academy Virtual' limit 1;
  if v_school is null then
    raise exception 'No school named The Academy Virtual. Nothing changed.';
  end if;

  select s.id,
         coalesce(s.status, ''),
         coalesce(to_jsonb(s) ->> 'student_number', ''),
         s.school_id
    into v_child, v_status, v_number, v_at
    from public.students s
   where regexp_replace(
           regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                          '\(.*?\)', '', 'g'),
           '[^a-z0-9]', '', 'g')
         = 'michaelneuwirth'
   limit 1;

  ------------------------------------------------------------------ already there
  if v_child is not null then
    if v_status = 'active' and v_at = v_school then
      raise notice 'Michael Neuwirth is already active at The Academy Virtual. Nothing changed.';
      return;
    end if;

    update public.students
       set status     = 'active',
           school_id  = v_school,
           updated_at = now()
     where id = v_child;

    raise notice 'Michael Neuwirth was on the books (status %). Reactivated at The Academy Virtual, number % kept.',
      v_status, coalesce(nullif(v_number, ''), '(none)');
    return;
  end if;

  --------------------------------------------------------------------- brand new
  select coalesce(max(nullif(regexp_replace(
           coalesce(to_jsonb(x) ->> 'student_number', ''), '[^0-9]', '', 'g'), '')::bigint), 0) + 1
    into v_next
    from public.students x
   where x.school_id = v_school;

  insert into public.students (school_id, first_name, last_name, student_number, status)
  values (v_school, 'Michael', 'Neuwirth', to_char(v_next, 'FM000000'), 'active');

  raise notice 'Created Michael Neuwirth at The Academy Virtual, number %.',
    to_char(v_next, 'FM000000');
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT one row: Michael Neuwirth, The Academy Virtual, active, with a number.
-- Two rows would mean a duplicate record exists and needs sorting out before
-- any teacher logs a class against him.

select trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,''))  as child,
       coalesce(sc.name, '(no school)')                                    as school,
       coalesce(s.status, '')                                              as status,
       coalesce(to_jsonb(s) ->> 'student_number', '(none)')                as student_number
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 where regexp_replace(
         regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                        '\(.*?\)', '', 'g'),
         '[^a-z0-9]', '', 'g')
       = 'michaelneuwirth';
