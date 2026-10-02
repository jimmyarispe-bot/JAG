-- 467_two_teachers_names_are_spelled_two_ways_2026_10_02.sql
--
-- DO NOT RUN THIS UNTIL JIMMY HAS CONFIRMED THE SPELLINGS.
--
-- 2 October 2026. Checking what name each teacher's new screen would show
-- turned up two people whose name is stored two different ways:
--
--   users.full_name        employee_profiles        email says
--   ---------------------  -----------------------  ---------------------
--   Cassandra Manghum      Cassandra Manghun        cassandra.manghum@
--   Marisa Vanella         Marissa Vanella          marisa.vanella@
--
-- WHY IT MATTERS RATHER THAN BEING A TYPO. The two are read by different
-- screens. The teacher's own page reads users (display_name, then full_name).
-- The payroll screen reads employee_profiles first - that is where
-- namesByEmployeeId was pointed on 1 October to stop it printing uuids. So
-- Cassandra signs in to a page that spells her name correctly, and appears on
-- the pay record as somebody else. A person's name misspelled on the document
-- that pays them is not a cosmetic fault.
--
-- WHICH ONE THIS FILE TREATS AS CORRECT. The users row and the email address
-- agree with each other in both cases, and the employee profile is the odd
-- one out. So this file corrects employee_profiles to match. That is an
-- inference from two sources agreeing, NOT a fact anybody confirmed - if
-- either woman actually spells it Manghun or Marissa, say so and this file
-- gets rewritten the other way round before it is run.
--
-- Nothing else is touched. Two named people, one column each.
--
-- Safe to re-run: a row already correct is left alone and said so.

begin;

do $$
declare
  r        record;
  v_rows   int;
  v_fixed  int := 0;
begin
  for r in
    select * from (values
      ('cassandra.manghum@theacademyvirtual.org', 'Cassandra', 'Manghum'),
      ('marisa.vanella@theacademyvirtual.org',    'Marisa',    'Vanella')
    ) as t(email, first_name, last_name)
  loop
    update public.employee_profiles ep
       set first_name = r.first_name,
           last_name  = r.last_name,
           updated_at = now()
      from public.employees e
      join public.users u on u.id = e.user_id
     where ep.employee_id = e.id
       and lower(coalesce(to_jsonb(u) ->> 'email','')) = lower(r.email)
       and (coalesce(ep.first_name,'') is distinct from r.first_name
         or coalesce(ep.last_name,'')  is distinct from r.last_name);

    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      raise notice 'No change for % (already correct, or no profile found).', r.email;
    else
      v_fixed := v_fixed + v_rows;
      raise notice 'Corrected % to % %', r.email, r.first_name, r.last_name;
    end if;
  end loop;

  raise notice 'Done: % profile row(s) corrected.', v_fixed;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- EXPECT both rows to read 'same' in the last column.
--
-- Any 'STILL DIFFERENT' means the two sources still disagree and the payroll
-- screen and the teacher's own screen will still print different names.

select coalesce(to_jsonb(u) ->> 'email','')                        as email,
       nullif(trim(coalesce(to_jsonb(u) ->> 'full_name','')), '')  as name_on_the_teachers_screen,
       nullif(trim(coalesce(ep.first_name,'') || ' ' ||
                   coalesce(ep.last_name,'')), '')                 as name_on_the_payroll_screen,
       case
         when nullif(trim(coalesce(to_jsonb(u) ->> 'full_name','')), '')
            = nullif(trim(coalesce(ep.first_name,'') || ' ' || coalesce(ep.last_name,'')), '')
           then 'same'
         else 'STILL DIFFERENT'
       end                                                         as agreement
  from public.users u
  join public.user_roles ur on ur.user_id = u.id
  join public.roles r       on r.id = ur.role_id
  join public.employees e   on e.user_id = u.id
  join public.employee_profiles ep on ep.employee_id = e.id
 where r.name = 'TEACHER'
 order by agreement, email;
