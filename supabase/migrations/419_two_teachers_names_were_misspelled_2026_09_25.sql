/*
  419 — TWO TEACHERS' NAMES WERE MISSPELLED IN JAG

  WHAT WAS WRONG. Creating the twelve teacher accounts in Supabase Auth on
  25 September, Jimmy typed the real addresses and two of them did not match
  what JAG held:

      JAG had                          The real address
      Casandra.Manghun@...             Cassandra.Manghun@...
      Renne.Tracewell@...              Renee.Tracewell@...

  WHY IT MATTERS MORE THAN A LINK. Migration 400 joins a teacher to their
  account on lower(auth.email) = lower(contact_email), so a mismatch leaves
  that teacher at NO LOGIN with no error - a silent failure of exactly the kind
  this codebase keeps producing. But the address is also where JAG writes to
  them. Two teachers have had a wrong address on file for as long as the record
  has existed, and anything sent to them went nowhere.

  THE NAMES GO WITH THE ADDRESSES. If the address is Cassandra, the person is
  Cassandra. Her name as stored is what a pay screen shows her and what a
  letter would call her, so leaving it misspelled while fixing the address
  would be fixing the machine and not the person.

  MATCHED ON THE OLD ADDRESS, not on a name or an id. The address is the thing
  we know was wrong and the thing that is unique; a name match would be
  matching on the very field being corrected.
*/

do $$
declare
  v_updated int;
  v_total   int := 0;
begin
  update public.employee_profiles
     set contact_email = 'Cassandra.Manghun@TheAcademyVirtual.org',
         first_name    = 'Cassandra'
   where lower(contact_email) = lower('Casandra.Manghun@TheAcademyVirtual.org');
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception
      'Expected 1 profile for Casandra Manghun, found % - nothing changed', v_updated;
  end if;
  v_total := v_total + v_updated;

  update public.employee_profiles
     set contact_email = 'Renee.Tracewell@TheAcademyVirtual.org',
         first_name    = 'Renee'
   where lower(contact_email) = lower('Renne.Tracewell@TheAcademyVirtual.org');
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception
      'Expected 1 profile for Renne Tracewell, found % - nothing changed', v_updated;
  end if;
  v_total := v_total + v_updated;

  raise notice 'Corrected % teacher profiles', v_total;
end $$;

/*
  DISPLAY NAME, where one is stored separately and still carries the old
  spelling. Left alone when it is null or already right.
*/
update public.employee_profiles
   set display_name = 'Cassandra Manghun'
 where lower(contact_email) = lower('Cassandra.Manghun@TheAcademyVirtual.org')
   and display_name is not null
   and display_name ilike '%asandra%'
   and display_name not like 'Cassandra%';

update public.employee_profiles
   set display_name = 'Renee Tracewell'
 where lower(contact_email) = lower('Renee.Tracewell@TheAcademyVirtual.org')
   and display_name is not null
   and display_name ilike '%Tracewell%'
   and display_name not like 'Renee%';

/*
  SHOW THE RESULT. Every active teacher, their address, and whether they can
  sign in - so the two corrected rows can be read in context rather than
  trusted. They will still say NO LOGIN until migration 400 is run again; that
  is the next step, not a fault.
*/
select
  coalesce(
    nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
    p.display_name, e.employee_number
  ) as teacher,
  coalesce(p.contact_email, '(no address on file)') as address,
  case when e.user_id is null then 'NO LOGIN' else 'can sign in' end as status
from public.employees e
left join public.employee_profiles p on p.employee_id = e.id
where e.employee_type = 'teacher'
  and coalesce(e.employment_status, 'active') = 'active'
order by teacher;
