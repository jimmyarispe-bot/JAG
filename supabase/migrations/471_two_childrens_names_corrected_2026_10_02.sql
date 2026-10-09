-- 471_two_childrens_names_corrected_2026_10_02.sql
--
-- Jimmy, 2 October 2026: "correct these student names pls -
--   Fiona Drescher (HS); Israel (Josiah) Cooks (GA)"
--
-- WHAT MAKES THIS DIFFERENT FROM EVERY OTHER UPDATE TODAY. A correction has
-- to find the row by the name that is WRONG. Guess that wrong name even
-- slightly and the update matches nothing, changes nothing, and reports
-- success - and a child keeps being called by a name that is not hers in
-- front of thirteen teachers. Zero rows and no error, again.
--
-- SO IT SEARCHES WIDELY AND THEN REFUSES TO ACT ON ANYTHING AMBIGUOUS.
-- Each child is looked for by campus plus a loose pattern, and the block
-- raises rather than commits unless it finds EXACTLY ONE. If it refuses,
-- the notice says what it did find, and the fix is to narrow the pattern -
-- not to widen it until something matches.
--
--   Fiona        at The Academy HS, any child whose first name is Fiona
--                  -> first_name 'Fiona', last_name 'Drescher'
--
--   Israel Cooks at The Academy GA, any child whose first name begins
--                  Israel or Josiah, or whose last name begins Cook
--                  -> first_name 'Israel (Josiah)', last_name 'Cooks'
--
-- THE BRACKETED NAME GOES IN first_name, which is how the roll already holds
-- this shape - "Samuel (John) Dobson" is stored that way. Everywhere the
-- platform compares names it strips anything in brackets first, so nothing
-- downstream is confused by it, and a teacher reading the grid sees the name
-- the child is actually called.
--
-- NOTHING ELSE CHANGES. Not the campus, not the student number, not the
-- status. Two children, two name columns each.
--
-- Safe to re-run: a child already named correctly is found by the search,
-- updated to the same values, and said so.

begin;

do $$
declare
  v_school uuid;
  v_child  uuid;
  v_n      int;
  v_was    text;
begin
  ------------------------------------------------------------------- Fiona --
  select id into v_school from public.schools where name = 'The Academy HS' limit 1;
  if v_school is null then
    raise exception 'No school named The Academy HS. Nothing changed.';
  end if;

  select count(*) into v_n
    from public.students s
   where s.school_id = v_school
     and regexp_replace(lower(coalesce(s.first_name,'')), '[^a-z0-9]', '', 'g')
         like 'fiona%';

  if v_n <> 1 then
    raise exception
      'Looked for one child called Fiona at The Academy HS and found %. Nothing changed - tell Claude what the record actually says.',
      v_n;
  end if;

  select s.id, trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,''))
    into v_child, v_was
    from public.students s
   where s.school_id = v_school
     and regexp_replace(lower(coalesce(s.first_name,'')), '[^a-z0-9]', '', 'g')
         like 'fiona%';

  update public.students
     set first_name = 'Fiona',
         last_name  = 'Drescher',
         updated_at = now()
   where id = v_child;

  raise notice 'The Academy HS: "%" is now "Fiona Drescher".', v_was;

  ------------------------------------------------------------------ Israel --
  select id into v_school from public.schools where name = 'The Academy GA' limit 1;
  if v_school is null then
    raise exception 'No school named The Academy GA. Nothing changed.';
  end if;

  select count(*) into v_n
    from public.students s
   where s.school_id = v_school
     and (regexp_replace(lower(coalesce(s.first_name,'')), '[^a-z0-9]', '', 'g') like 'israel%'
       or regexp_replace(lower(coalesce(s.first_name,'')), '[^a-z0-9]', '', 'g') like 'josiah%'
       or regexp_replace(lower(coalesce(s.last_name,'')),  '[^a-z0-9]', '', 'g') like 'cook%');

  if v_n <> 1 then
    raise exception
      'Looked for one child called Israel / Josiah / Cooks at The Academy GA and found %. Nothing changed - tell Claude what the record actually says.',
      v_n;
  end if;

  select s.id, trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,''))
    into v_child, v_was
    from public.students s
   where s.school_id = v_school
     and (regexp_replace(lower(coalesce(s.first_name,'')), '[^a-z0-9]', '', 'g') like 'israel%'
       or regexp_replace(lower(coalesce(s.first_name,'')), '[^a-z0-9]', '', 'g') like 'josiah%'
       or regexp_replace(lower(coalesce(s.last_name,'')),  '[^a-z0-9]', '', 'g') like 'cook%');

  update public.students
     set first_name = 'Israel (Josiah)',
         last_name  = 'Cooks',
         updated_at = now()
   where id = v_child;

  raise notice 'The Academy GA: "%" is now "Israel (Josiah) Cooks".', v_was;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT exactly two rows:
--   Fiona Drescher          The Academy HS   active
--   Israel (Josiah) Cooks   The Academy GA   active
--
-- Their student numbers are unchanged from whatever they were.

select trim(coalesce(s.first_name,'') || ' ' || coalesce(s.last_name,''))  as child,
       coalesce(sc.name, '(no school)')                                    as school,
       coalesce(s.status, '')                                              as status,
       coalesce(to_jsonb(s) ->> 'student_number', '(none)')                as student_number
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 where (s.first_name = 'Fiona'           and s.last_name = 'Drescher')
    or (s.first_name = 'Israel (Josiah)' and s.last_name = 'Cooks')
 order by 2, 1;
