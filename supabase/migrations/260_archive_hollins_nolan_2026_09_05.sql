-- 260: Hollins Nolan — former student, archive if present.
--
-- Her application (2022-23, 6th grade, DOB 18-Jul-2010) surfaced while looking
-- for Nolan Riley, because both are surname-first documents in the Nolan/Riley
-- name space. She is a former student, not a current one.
--
-- Searched across EVERY school, not just The Academy GA — she applied to the
-- Marietta/Smyrna campus but may have been recorded anywhere.
--
-- Reversible: status='archived' with previous_status kept. Idempotent.
-- Reports plainly if she is not in JAG at all, which is a valid outcome.

begin;

do $$
declare
  v_count int;
  v_names text;
begin
  select count(*), string_agg(s.first_name || ' ' || s.last_name || ' @ ' ||
                              coalesce(sc.name, 'no school') || ' (' || s.status || ')', '; ')
    into v_count, v_names
  from public.students s
  left join public.schools sc on sc.id = s.school_id
  where lower(s.first_name) like 'hollins%'
     or (lower(s.last_name) = 'nolan' and lower(s.first_name) <> 'nolan');

  if v_count = 0 then
    raise notice 'Hollins Nolan is not in JAG. Nothing to archive.';
    return;
  end if;

  raise notice 'Found %: %', v_count, v_names;

  update public.students s
     set previous_status = coalesce(s.previous_status, s.status),
         status          = 'archived',
         archived_at     = now()
   where (lower(s.first_name) like 'hollins%'
          or (lower(s.last_name) = 'nolan' and lower(s.first_name) <> 'nolan'))
     and s.status <> 'archived';
end $$;

-- Any lead under the Nolan family email that is not Nolan Riley's corrected one.
-- ashleygnolan@gmail.com is Hollins' guardian; imaniremona@gmail.com is Nolan
-- Riley's. Two different families despite the shared name.
select 'lead' as kind,
       l.first_name || ' ' || l.last_name as name,
       l.lead_stage,
       l.guardian_email
from public.admissions_leads l
where l.guardian_email ilike '%ashleygnolan%'
   or lower(l.first_name) like 'hollins%'
   or (lower(l.last_name) = 'nolan' and lower(l.first_name) <> 'nolan');

-- Everyone still standing with these names, so nothing is left ambiguous.
select s.first_name || ' ' || s.last_name as student,
       sc.name as school, s.status, s.previous_status, s.grade_level
from public.students s
left join public.schools sc on sc.id = s.school_id
where lower(s.last_name) in ('nolan', 'riley')
   or lower(s.first_name) like 'hollins%'
order by 1;

commit;
