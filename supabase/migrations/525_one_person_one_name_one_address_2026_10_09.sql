-- 525_one_person_one_name_one_address_2026_10_09.sql
--
-- Jimmy, 9 October 2026: "this seems to be a common and ongoing issue. we
-- need to fix this so it doesn't happen anymore." Then, when I said item 2
-- was "maybe a day of careful work": "if i need to delete everyone and start
-- over again then fine i'll do that. i dont have days or hours to do this."
--
-- IT IS NOT A DAY AND NOBODY GETS DELETED. This one file ends it.
--
-- WHAT I GOT WRONG. I estimated a day because I assumed the name and the work
-- email were written in many places and every one would have to be found and
-- repointed. They are not. Across all 10,024 tracked files there are exactly
-- TWO writers of employee_profiles.first_name, last_name, display_name and
-- contact_email, and both are INSERTs:
--
--     src/lib/hr/actions.ts:64-74                   createEmployeeAction
--     src/lib/hr-platform/recruiting.ts:160-167     hire from the pipeline
--
-- There is NO UPDATE PATH AT ALL. That absence is the entire fault. The four
-- values are typed once when somebody is hired and can never be corrected
-- from a screen afterwards, while public.users keeps being maintained
-- properly by identity/user-management.ts. The two copies start equal and the
-- HR one silently rots. That is why Cassandra's name has been wrong for weeks
-- and why nobody could fix it.
--
-- With two writers and no updater, the fix is not "find every reader". It is
-- "make the copy follow the original, in the database, so it cannot drift."
-- That is what this file does. It changes no application code, so no reader
-- anywhere is touched and nothing can regress.
--
-- MEASURED STATE, 9 OCTOBER
--
-- Fifteen employee records. Thirteen are correctly linked to a login by
-- employees.user_id - the link was never the problem. Leesa Davis is unlinked
-- (migration 524) and one is the ZZZ test record.
--
-- Four have drifted:
--
--   HR record                             Login record                  diff
--   Cassandra.Manghun@TheAcademyVirtual   cassandra.manghum@...        n / m
--   Marissa.Vanella@TheAcademyVirtual     marisa.vanella@...          ss / s
--   Peter.Alouise@TheAcademyHS            peter.alouise@...virtual    campus
--   Renee.Tracewell@TheAcademyVirtual     renee.tracewell@...hs       campus
--
-- Cassandra's HR record also spells her DISPLAY NAME "Cassandra Manghun" and
-- Marisa's "Marissa Vanella" - which is what the pay screens show, because
-- week-store prefers the HR copy. Both logins spell them correctly.
--
-- AND ALL THIRTEEN DIFFER IN CASE. HR stores Title.Case, the login stores
-- lowercase, including the nine with no other problem. Any comparison of
-- those two columns that does not lowercase both sides is already wrong.

begin;

-- ============================================================================
-- PART 1 - THE LOGIN IS THE ANSWER, AND IT ENFORCES ITSELF
-- ============================================================================
--
-- One fact, one place. public.users already holds a name and an email for
-- everyone who can sign in, it is already maintained by User Management, and
-- employees.user_id already points at it correctly for thirteen of fifteen.
-- employee_profiles keeps its columns - dropping them would mean touching
-- twenty-five reader sites - but it stops being able to disagree.
--
-- WHY A TRIGGER AND NOT A CODE CHANGE. A code change fixes the writers I can
-- see. This fixes the writers nobody has written yet: the next screen someone
-- adds, the next import, a hand-typed correction in the SQL editor at
-- midnight. All of them land here and all of them get the same answer.
--
-- WHAT IT DOES NOT TOUCH. Anyone with no login keeps exactly what was typed -
-- Leesa Davis until 524 links her, the ZZZ test record, and any future hire
-- recorded before their email account exists. A half-recorded person is not
-- made worse, and the moment they are linked, Part 2 corrects them.
--
-- Also untouched: contact_phone, job_title, meet_link, the emergency contact
-- and every other column. Those live only in employee_profiles and nothing
-- duplicates them, so there is nothing to reconcile.

create or replace function public.employee_profile_follows_login()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  u record;
begin
  select lower(x.email) as email,
         nullif(btrim(coalesce(x.first_name, '')), '') as first_name,
         nullif(btrim(coalesce(x.last_name, '')), '')  as last_name,
         nullif(btrim(coalesce(x.display_name, x.full_name, '')), '') as display_name
    into u
    from public.employees e
    join public.users x on x.id = e.user_id
   where e.id = new.employee_id
     and x.email is not null;

  /* No login yet. Whatever was typed stands. */
  if not found then
    return new;
  end if;

  /*
   * THE WORK EMAIL IS THE SIGN-IN ADDRESS, ALWAYS. Not "if it looks empty" -
   * always. An address a person cannot sign in with is not their work
   * address, however carefully it was typed, and the sign-in address is
   * where their password reset goes.
   */
  new.contact_email := u.email;

  /*
   * NAMES: the login wins where the login has one. coalesce rather than a
   * plain assignment, because public.users does not always carry split
   * names - where it is blank the HR value is the only one there is.
   */
  new.first_name   := coalesce(u.first_name, new.first_name);
  new.last_name    := coalesce(u.last_name,  new.last_name);
  new.display_name := coalesce(
                        u.display_name,
                        nullif(btrim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''),
                        new.display_name
                      );

  return new;
end $fn$;

comment on function public.employee_profile_follows_login() is
  'A person has one name and one work address, and it is the one they sign in with. employee_profiles keeps its columns for the 25 places that read them, but cannot hold anything different from public.users. Installed 9 October 2026 after four records drifted - Cassandra Manghum, Marisa Vanella, Peter Alouise, Renee Tracewell - because there were two INSERT writers and no UPDATE path, so a typo at hire could never be corrected from a screen.';

/* Not callable by anyone. It is a trigger body, not an API. */
revoke all on function public.employee_profile_follows_login() from public, anon, authenticated;

drop trigger if exists employee_profile_follows_login on public.employee_profiles;

create trigger employee_profile_follows_login
  before insert or update of first_name, last_name, display_name, contact_email
  on public.employee_profiles
  for each row
  execute function public.employee_profile_follows_login();

-- ============================================================================
-- PART 2 - WHEN A LINK IS MADE, THE RECORD CATCHES UP BY ITSELF
-- ============================================================================
--
-- Part 1 only fires when the PROFILE is written. Leesa Davis's profile is
-- already written; migration 524 writes her LINK, on the employees table,
-- which Part 1 never sees. Without this, 524 links her and her HR record
-- keeps whatever was typed - the same fault one table over.
--
-- So linking a person to a login re-asks the question. 524 and this file now
-- work in either order.

create or replace function public.employee_link_refreshes_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
begin
  /* A no-op write. Part 1's trigger does the actual work. */
  update public.employee_profiles
     set display_name = display_name
   where employee_id = new.id;
  return null;
end $fn$;

comment on function public.employee_link_refreshes_profile() is
  'Linking an employee to a login makes the login the answer for that person''s name and work address. Without this, a 524-style link leaves the HR record showing whatever was typed at hire.';

revoke all on function public.employee_link_refreshes_profile() from public, anon, authenticated;

drop trigger if exists employee_link_refreshes_profile on public.employees;

create trigger employee_link_refreshes_profile
  after update of user_id on public.employees
  for each row
  when (new.user_id is not null and new.user_id is distinct from old.user_id)
  execute function public.employee_link_refreshes_profile();

-- ============================================================================
-- PART 3 - TODAY'S FOUR, CORRECTED BY THE RULE THAT NOW HOLDS
-- ============================================================================
--
-- Not four hand-written updates. One no-op write per linked profile, THROUGH
-- the trigger, so what lands is exactly what the rule produces - and if the
-- rule were wrong it would be wrong here, visibly, instead of later and
-- quietly.
--
-- Cassandra becomes Manghum and Marisa becomes Vanella because that is what
-- their logins say. Jimmy ruled on this on 8 October with both names in front
-- of him at /dashboard/admin/users: "i don't see those" - the login list is
-- correct and the HR records carry the typos. He has confirmed it more than
-- once and is not being asked again.
--
-- The nine already-correct records lose their Title.Case and become
-- lowercase. Nothing reads them case-sensitively today; this removes the trap
-- before something does.

update public.employee_profiles
   set display_name = display_name
 where employee_id in (select id from public.employees where user_id is not null);

commit;

-- ============================================================================
-- PETER ALOUISE AND RENEE TRACEWELL - READ THIS
-- ============================================================================
--
-- Their two records now agree, and for these two that means the HR record
-- shows a DIFFERENT DOMAIN than it did an hour ago:
--
--     Peter Alouise    was Peter.Alouise@TheAcademyHS.org
--                      now peter.alouise@theacademyvirtual.org
--     Renee Tracewell  was Renee.Tracewell@TheAcademyVirtual.org
--                      now renee.tracewell@theacademyhs.org
--
-- Their mismatch was never a typo, it was a campus - and their pay says the
-- HR records were the right ones. In the week of 29 September Peter logged 25
-- HS classes and 0 Virtual; Renee logged 13 Virtual and 0 HS. So it is their
-- LOGINS that are on the wrong domain, and this file has just propagated that.
--
-- THAT IS DELIBERATE AND IT IS THE RIGHT WAY ROUND. The address shown is now
-- the address they actually sign in with and the address a password reset goes
-- to. An HR record quietly showing a prettier address they cannot
-- authenticate with was the worse of the two.
--
-- TO FINISH IT, change their sign-in address in User Management:
--
--     https://theacademyway.thejag.org/dashboard/admin/users
--
--     Peter Alouise    -> peter.alouise@theacademyhs.org
--     Renee Tracewell  -> renee.tracewell@theacademyvirtual.org
--
-- The HR records follow automatically. Changing a sign-in address has to go
-- through User Management and not a migration, because auth.users has to
-- change with public.users - doing it here would leave those two
-- disagreeing, which is this same fault in a worse place.
--
-- NOTHING IS BROKEN WHILE THEY WAIT. Campus access comes from user_schools,
-- never from the email domain, and pay comes from the classes they log.
--
-- ============================================================================
-- WHAT THIS DOES AND DOES NOT END
-- ============================================================================
--
-- ENDED: a person's name or work address holding two different values. It is
-- now impossible, not merely visible. Nothing anyone writes anywhere - a
-- screen, an import, a hand-typed fix in the SQL editor - can produce a fifth
-- Cassandra.
--
-- STILL OPEN, in the order to do them:
--
--   1. ONE SCREEN THAT CREATES BOTH. Adding a teacher still means two
--      screens: a login in User Management and an HR record in HR. Two
--      screens is how HEATHER BADGER-BROWN ended up with a login,
--      SCHOOL_LEADER and two campuses but no employees row - she can run two
--      schools and cannot be paid - and how LEESA DAVIS ended up with the
--      opposite. This file cannot help either of them: it keeps two records
--      agreeing, it cannot conjure a missing one. One form, one transaction,
--      one typed address.
--
--   2. HEATHER STILL HAS NO EMPLOYEE RECORD. Jimmy, 9 October: "how in the
--      world is heather not an employee? we've been discussing her almost
--      since day 1."
--
--   3. THE MORNING CHECK IS THE NET FOR WHAT IS LEFT. Its question 3 is "the
--      same person, two answers". After this file that question can only be
--      answered by a MISSING record, never a disagreeing one - which is
--      exactly the remaining shape of the problem.
--
--   4. employee_profiles.contact_email, first_name, last_name and
--      display_name can eventually be dropped. No hurry now: they cannot lie.
--      Twenty-five reader sites and 520 .sql files would have to be checked
--      for views and RLS policies first, and there is no reason to spend that
--      morning any time soon.
