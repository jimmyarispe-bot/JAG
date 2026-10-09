-- ==========================================================================
-- 516 — LEESA DAVIS GETS HER EMAIL ADDRESS
--
-- 8 October 2026.
--
--   RUN THIS *AFTER* adding her at
--   https://theacademyway.thejag.org/dashboard/hr?view=create
--
-- ── WHY A SECOND STEP IS NEEDED ───────────────────────────────────────────
--
-- The Add Employee screen collects First Name, Last Name, Job Title, School,
-- Department, Hire Date, Type and Emergency Contact. It does NOT collect an
-- email address.
--
-- createEmployee (hr/actions.ts:67) writes employee_profiles.contact_email
-- from the form, and HrForms.tsx never renders an input for it. So every
-- employee added through that screen arrives with no address, silently.
--
-- The screen is still the right way to add her: it also writes her service
-- history and seeds her onboarding tasks, including the background check.
-- This only fills in the one field the screen cannot.
--
-- The form itself should have that field. That is a code change, not this.
--
-- ── WHAT THIS DOES ────────────────────────────────────────────────────────
--
--   Leesa Davis, The Academy Virtual
--   contact_email -> leesa.davis@theacademyvirtual.org
--
-- Nothing else. Not her name, her title, her campus, her type or her status.
--
-- Idempotent. Re-running changes nothing and still passes.
-- ==========================================================================

begin;

do $$
declare
  v_profile uuid;
  v_found   int;
  v_current text;
begin
  -- Matched on her name AND her campus. A name alone is how one Heather
  -- becomes another; two campuses already share a Heather Badger-Brown.
  select count(*) into v_found
  from public.employee_profiles p
  join public.employees e on e.id = p.employee_id
  join public.schools  s on s.id = e.school_id
  where lower(trim(coalesce(p.first_name, ''))) = 'leesa'
    and lower(trim(coalesce(p.last_name,  ''))) = 'davis'
    and lower(trim(s.name)) = 'the academy virtual';

  if v_found = 0 then
    raise exception
      '516: no Leesa Davis at The Academy Virtual. Add her first at '
      '/dashboard/hr?view=create , then run this again. Nothing changed.';
  end if;

  if v_found > 1 then
    raise exception
      '516: % profiles named Leesa Davis at The Academy Virtual. Two records '
      'for one teacher is a separate decision — stopping rather than guessing '
      'which one holds her mail.', v_found;
  end if;

  select p.id, coalesce(p.contact_email, '')
    into v_profile, v_current
  from public.employee_profiles p
  join public.employees e on e.id = p.employee_id
  join public.schools  s on s.id = e.school_id
  where lower(trim(coalesce(p.first_name, ''))) = 'leesa'
    and lower(trim(coalesce(p.last_name,  ''))) = 'davis'
    and lower(trim(s.name)) = 'the academy virtual';

  -- An address already there and DIFFERENT is not ours to overwrite.
  if v_current <> '' and lower(v_current) <> 'leesa.davis@theacademyvirtual.org' then
    raise exception
      '516: Leesa Davis already has % on her record. Overwriting an address '
      'somebody deliberately set is not something this should do quietly.',
      v_current;
  end if;

  update public.employee_profiles
  set contact_email = 'leesa.davis@theacademyvirtual.org'
  where id = v_profile;

  raise notice '516: Leesa Davis is reachable at leesa.davis@theacademyvirtual.org';
end $$;

commit;

-- ── SEE IT DONE ──────────────────────────────────────────────────────────
-- Every teacher at The Academy Virtual, so you can see her in the list she
-- is meant to be in — and see at a glance who else has no address.
select
  trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))  as teacher,
  s.name                                                               as campus,
  coalesce(p.job_title, '(no title)')                                  as job_title,
  e.employee_type                                                      as type,
  e.employment_status                                                  as status,
  coalesce(nullif(p.contact_email, ''), '>>> NO EMAIL <<<')            as email,
  coalesce(e.employee_number, '(no number)')                           as employee_number,
  case when e.user_id is null then 'no sign-in yet'
       else 'can sign in' end                                          as account
from public.employee_profiles p
join public.employees e on e.id = p.employee_id
join public.schools  s on s.id = e.school_id
where lower(trim(s.name)) = 'the academy virtual'
  and e.employment_status = 'active'
order by p.last_name, p.first_name;
