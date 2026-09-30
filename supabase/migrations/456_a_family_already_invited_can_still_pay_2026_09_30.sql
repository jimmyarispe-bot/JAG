-- 456_a_family_already_invited_can_still_pay_2026_09_30.sql
--
-- The backfill for the change of 30 September: an application is now created
-- when a family is INVITED, not when they are accepted, so the $100 has
-- somewhere to live while they fill the application in.
--
-- WHO THIS IS FOR. Every lead already holding an application_access_token but
-- with no row in admissions_applications. They have a working link, they can
-- complete the form, and without this they would see no fee at all - because
-- the panel refuses rather than showing $0 when it cannot find an
-- application. Silence would look like "nothing to pay".
--
-- WHAT IT DOES NOT DO. It does not mint tokens, does not invite anybody, does
-- not email. A lead with no token has not been invited and is none of this
-- migration's business.
--
-- REFUSED, NOT GUESSED. A campus with no current school year gets nothing:
-- attaching a family's money to a year nobody chose is worse than a missing
-- row, and harder to find later. Those leads are counted and named so
-- somebody can set the year and re-run this.
--
-- application_fee_cents is not set here. Migration 291 defaults it to 10000,
-- and the $100 should be written down in exactly one place.
--
-- application_status is 'in_progress', the same value both code paths use.
-- A new status invented in a migration is a status every screen learns about
-- from a family's page rather than from a decision.
--
-- Safe to re-run: the insert skips any lead that already has an application.

begin;

do $$
declare
  v_created  integer := 0;
  v_no_year  integer := 0;
  v_row      record;
begin

  -- ---------------------------------------------------------------------
  -- 1. Create one application per invited lead that has none, at that
  --    lead's OWN school's current year.
  -- ---------------------------------------------------------------------
  with invited as (
    select l.id as lead_id, l.school_id
      from public.admissions_leads l
     where l.application_access_token is not null
       and not exists (
         select 1 from public.admissions_applications a where a.lead_id = l.id
       )
  ),
  placed as (
    select i.lead_id, y.id as school_year_id
      from invited i
      join public.school_years y
        on y.school_id = i.school_id and y.is_current = true
  ),
  inserted as (
    insert into public.admissions_applications (lead_id, school_year_id, application_status)
    select p.lead_id, p.school_year_id, 'in_progress' from placed p
    returning 1
  )
  select count(*) into v_created from inserted;

  -- ---------------------------------------------------------------------
  -- 2. Who was left out, and why. Named, not just counted - a number alone
  --    is something nobody acts on.
  -- ---------------------------------------------------------------------
  for v_row in
    select l.id as lead_id,
           coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as child,
           coalesce(s.name, '(no campus on the record)') as campus
      from public.admissions_leads l
      left join public.schools s on s.id = l.school_id
     where l.application_access_token is not null
       and not exists (
         select 1 from public.admissions_applications a where a.lead_id = l.id
       )
     order by 3, 2
  loop
    v_no_year := v_no_year + 1;
    raise notice
      '456: NO APPLICATION for % (%) - lead %. Their campus has no current '
      'school year, or they have no campus. Set it, then re-run this file.',
      v_row.child, v_row.campus, v_row.lead_id;
  end loop;

  raise notice '456: % application(s) created, % invited lead(s) still without one.',
    v_created, v_no_year;
end $$;

commit;

-- ── VERIFY ───────────────────────────────────────────────────────────────────
-- Every invited family, and whether they now have somewhere to pay.
-- `fee_cents` should read 10000 on every new row - the default from 291.

select coalesce(s.name, '(no campus)')                 as campus,
       coalesce(l.first_name, '') || ' ' || coalesce(l.last_name, '') as child,
       case when a.id is null then 'NO APPLICATION' else 'ok' end     as state,
       a.application_status                            as status,
       a.application_fee_status                        as fee_status,
       a.application_fee_cents                         as fee_cents
  from public.admissions_leads l
  left join public.schools s on s.id = l.school_id
  left join lateral (
    select * from public.admissions_applications x
     where x.lead_id = l.id order by x.created_at desc limit 1
  ) a on true
 where l.application_access_token is not null
 order by 3 desc, 1, 2;
