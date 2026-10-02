-- 465_five_children_filed_at_the_wrong_school_2026_10_02.sql
--
-- Migration 464 put the roll in and named five children whose school of
-- record disagreed with it. This moves those five, and nobody else.
--
--   Alexander Pobuda    roll FL, recorded at The Academy HS       000018
--   Isla Fitzgerald     roll FL, recorded at The Academy HS       000012
--   Penny Shropshire    roll FL, recorded at The Academy HS       000002
--   Mackenzie Morris    roll FL, recorded at The Academy Virtual  000020
--   Maximillian Salas   roll FL, recorded at The Academy Virtual  000022
--
-- THE ARITHMETIC SAYS THESE FIVE ARE THE WHOLE PROBLEM. After 464 the active
-- roll stood at FL 31, GA 22, HS 14, AV 11 against a roll of FL 36, GA 22,
-- HS 11, AV 9. Three too many at HS, two too many at AV, five short at FL.
-- Move these five and every column matches exactly. Nothing else is off.
--
-- WHY 464 COULD NOT DO IT. student_number is unique within a school
-- (idx_students_school_student_number), so carrying a child's number into a
-- new school collides with whoever already holds it there. 464 tried and
-- Postgres refused on (The Academy FL, 000012).
--
-- WHAT THIS DOES ABOUT IT, AND WHAT IT REFUSES TO DO.
--
-- A child KEEPS THEIR NUMBER if it is free at The Academy FL. A number is
-- something the office may have written on records, forms and invoices;
-- changing one to tidy a database is the kind of fix that turns up six months
-- later as a mismatched invoice.
--
-- Only where the number is already taken at FL is a new one assigned - the
-- next free number at that school - and the VERIFY block prints old and new
-- side by side so the change is a visible fact rather than a silent one.
--
-- NOTHING ELSE MOVES. Named children, one destination, and a guard that
-- refuses to touch anybody already at The Academy FL.
--
-- Safe to re-run: a child already moved is already at FL and is skipped.

begin;

do $$
declare
  v_fl      uuid;
  v_child   uuid;
  v_number  text;
  v_taken   boolean;
  v_next    bigint;
  v_moved   int := 0;
  v_renum   int := 0;
  r         record;
begin
  select id into v_fl from public.schools where name = 'The Academy FL' limit 1;
  if v_fl is null then
    raise exception 'No school named The Academy FL.';
  end if;

  for r in
    select * from (values
      ('Alexander',   'Pobuda'),
      ('Isla',        'Fitzgerald'),
      ('Penny',       'Shropshire'),
      ('Mackenzie',   'Morris'),
      ('Maximillian', 'Salas')
    ) as t(first_name, last_name)
  loop
    /* The same normalisation 464 used - trailing spaces and brackets ignored. */
    select s.id,
           coalesce(to_jsonb(s) ->> 'student_number', '')
      into v_child, v_number
      from public.students s
     where regexp_replace(
             regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                            '\(.*?\)', '', 'g'),
             '[^a-z0-9]', '', 'g')
           = regexp_replace(lower(r.first_name || r.last_name), '[^a-z0-9]', '', 'g')
       and s.school_id is distinct from v_fl
     limit 1;

    if v_child is null then
      /* Already moved, or the name no longer matches. Said out loud rather
         than counted as success. */
      raise notice 'Not moved (already at FL, or no match): % %', r.first_name, r.last_name;
      continue;
    end if;

    select exists (
      select 1 from public.students x
       where x.school_id = v_fl
         and coalesce(to_jsonb(x) ->> 'student_number', '') = v_number
         and v_number <> ''
    ) into v_taken;

    if v_taken then
      /* The next free number at FL, in the same zero-padded shape. */
      select coalesce(max(nullif(regexp_replace(
               coalesce(to_jsonb(x) ->> 'student_number', ''), '[^0-9]', '', 'g'), '')::bigint), 0) + 1
        into v_next
        from public.students x
       where x.school_id = v_fl;

      update public.students
         set school_id = v_fl,
             student_number = to_char(v_next, 'FM000000'),
             updated_at = now()
       where id = v_child;

      v_renum := v_renum + 1;
      raise notice 'Moved % % to FL and renumbered % -> %',
        r.first_name, r.last_name, v_number, to_char(v_next, 'FM000000');
    else
      update public.students
         set school_id = v_fl,
             updated_at = now()
       where id = v_child;

      raise notice 'Moved % % to FL, number % kept', r.first_name, r.last_name, v_number;
    end if;

    v_moved := v_moved + 1;
  end loop;

  raise notice 'Done: % moved, % of them renumbered.', v_moved, v_renum;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT the roll exactly: FL 36 · GA 22 · HS 11 · AV 9, all active.
--
-- Any other number means a child is still filed somewhere the roll does not
-- put them, and the five names above are where to look first.

select coalesce(sc.name, '(no school)')                        as school,
       count(*) filter (where coalesce(s.status,'') = 'active') as active_children,
       count(*) filter (where coalesce(s.status,'') <> 'active') as inactive
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 group by 1
 order by 1;
