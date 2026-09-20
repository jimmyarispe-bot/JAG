-- 277: archive the HS and Virtual students who are not enrolled for 2026-27.
--
-- Jimmy, 2026-09-06: "not enrolled students - fike children, caryhellis gomez,
-- allen children, retem beltran, jackson zercher, elijah halliman, lera in
-- holding pattern" — and, on the Allens, "all three, Kingstyn too."
--
-- NINE children. Same archive path migration 188 established and migrations
-- 258 and 268 used for GA: status = 'archived', previous_status kept, nothing
-- deleted. Their enrolment rows, guardians and history all survive.
--
-- LERA OSTERHOUDT IS NOT TOUCHED. "Holding pattern" is not "not enrolled".
-- She stays active and unbilled, and she is reported at the bottom so she does
-- not quietly become a child nobody is invoicing on purpose.
--
-- WHY THIS RUNS BEFORE ANY BILLING LOADER. Nine of the twenty-two HS/Virtual
-- children with no Square series turn out not to be students at all. Building
-- a tuition loader first would have produced nine plans for nine families who
-- owe nothing, and that is the shape of a wrong invoice.
--
-- EVERY NAME IS MATCHED EXPLICITLY, first and last. A surname-only probe would
-- have archived Kingstyn Allen by accident on the Virtual pass — which is the
-- exact question that had to be asked out loud before writing this.
--
-- IDEMPOTENT: a child already archived is skipped.

begin;

create temp table hv_archive (first_name text, last_name text, school_hint text) on commit drop;

insert into hv_archive values
  ('Dayven',     'Fike',       'Virtual'),
  ('Dylan',      'Fike',       'Virtual'),
  ('Caryhellis', 'Gomez',      'Virtual'),
  ('Abigail',    'Allen',      'Virtual'),
  ('Lauryn',     'Allen',      'Virtual'),
  ('Kingstyn',   'Allen',      'HS'),
  ('Retem',      'Beltran',    'Virtual'),
  ('Jackson',    'Zercher',    'Virtual'),
  ('Elijah',     'Halliman',   'Virtual');

do $$
declare
  r          record;
  v_id       uuid;
  v_hits     int;
  v_archived int := 0;
  v_already  int := 0;
  v_missing  text[] := '{}';
begin
  for r in select * from hv_archive loop

    -- Count before acting. Two matches means the probe is not specific enough,
    -- and archiving would remove a child who is still enrolled. That stops
    -- everything. Zero matches is reported, not fatal — the child may already
    -- have been archived by hand.
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
    raise notice 'NOT FOUND (check the spelling before assuming they are gone): %',
      array_to_string(v_missing, ', ');
  end if;
end $$;

-- Lera Osterhoudt, deliberately left alone.
select 'HOLDING PATTERN - active, not billed, on purpose' as note,
       s.first_name || ' ' || s.last_name as student,
       sc.name as school, s.grade_level, s.status
from public.students s
join public.schools sc on sc.id = s.school_id
where lower(s.last_name) = 'osterhoudt';

-- The headcount after this runs. Expect HS 17, Virtual 14.
select sc.name as school, count(*) as active_students
from public.students s
join public.schools sc on sc.id = s.school_id
where s.status = 'active'
  and (sc.name ilike '%academy hs%' or sc.name ilike '%academy virtual%')
group by sc.name
order by sc.name;

commit;
