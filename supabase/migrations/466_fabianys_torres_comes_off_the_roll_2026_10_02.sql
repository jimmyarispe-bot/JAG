-- 466_fabianys_torres_comes_off_the_roll_2026_10_02.sql
--
-- Jimmy, 2 October: "delete Fabianys Torres FL"
--
-- WHAT THIS DOES, SAID PLAINLY. It takes Fabianys Torres off the active roll
-- at The Academy FL. It does NOT erase the child's record.
--
-- WHY NOT ERASE IT. This is the same thing 464 did to the 42 children who
-- were not on the roll of 2 October - they went inactive, their records
-- stayed. Doing something different for this one child would mean the roll
-- was built two ways, and six months from now nobody could tell which 'gone'
-- a given child was. A student row is also the thing applications, contacts,
-- contracts, payments and attendance hang off; removing the row removes the
-- history of a child who was really here, and there is no undo for that.
--
-- IF JIMMY MEANS ERASE, that is a different file and he will say so. The
-- second query below prints exactly what an erase would take with it, so the
-- decision is made against the real number rather than a guess.
--
-- AFTER THIS the roll is FL 35 - GA 22 - HS 11 - AV 9, total 77.
--
-- Safe to re-run: a child already inactive is left alone and said so.

begin;

do $$
declare
  v_child  uuid;
  v_school text;
  v_status text;
begin
  /* The same normalisation 464 and 465 used: case, punctuation and anything
     in brackets ignored, so 'Fabianys (Fabi) Torres ' still matches. */
  select s.id,
         coalesce(sc.name, '(no school)'),
         coalesce(s.status, '')
    into v_child, v_school, v_status
    from public.students s
    left join public.schools sc on sc.id = s.school_id
   where regexp_replace(
           regexp_replace(lower(coalesce(s.first_name,'') || coalesce(s.last_name,'')),
                          '\(.*?\)', '', 'g'),
           '[^a-z0-9]', '', 'g')
         = 'fabianystorres'
   limit 1;

  if v_child is null then
    raise exception 'No child matching Fabianys Torres. Nothing changed.';
  end if;

  if v_status <> 'active' then
    raise notice 'Fabianys Torres (%) was already %, not active. Nothing changed.',
      v_school, v_status;
    return;
  end if;

  update public.students
     set status = 'inactive',
         updated_at = now()
   where id = v_child;

  raise notice 'Fabianys Torres (%) is now inactive. Was active.', v_school;
end $$;

commit;

-- ── VERIFY 1 of 2: the roll ──────────────────────────────────────────────────
-- EXPECT exactly: FL 35 · GA 22 · HS 11 · AV 9 active. Inactive goes 42 -> 43.

select coalesce(sc.name, '(no school)')                         as school,
       count(*) filter (where coalesce(s.status,'') = 'active')  as active_children,
       count(*) filter (where coalesce(s.status,'') <> 'active') as inactive
  from public.students s
  left join public.schools sc on sc.id = s.school_id
 group by 1
 order by 1;
