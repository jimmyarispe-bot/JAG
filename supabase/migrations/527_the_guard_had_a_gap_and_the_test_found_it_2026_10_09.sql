-- 527_the_guard_had_a_gap_and_the_test_found_it_2026_10_09.sql
--
-- Migration 525 installed employee_profile_follows_login and I reported it
-- verified. Then I ran the only test that actually matters - try to put the
-- typo back - and it got through:
--
--     update employee_profiles
--        set contact_email = 'Cassandra.Manghun@TheAcademyVirtual.org',
--            display_name  = 'Cassandra Manghun',
--            last_name     = 'Manghun'
--      where ...
--
--     contact_email  corrected to cassandra.manghum@...   PASS
--     display_name   corrected to Cassandra Manghum       PASS
--     last_name      STAYED Manghun                       FAIL
--
-- WHY. 525 says
--
--     new.first_name := coalesce(u.first_name, new.first_name);
--     new.last_name  := coalesce(u.last_name,  new.last_name);
--
-- and public.users.first_name and last_name are NULL for twelve of the
-- thirteen linked people. Only full_name is filled. So the coalesce falls
-- straight through to whatever was typed, every time, for everybody except
-- Leesa Davis - who is the one person whose split names exist, and therefore
-- the one person the guard was actually guarding.
--
-- The email and the display name were held. The two columns underneath them
-- were not, and anything rendering first_name + last_name would still have
-- shown Manghun. That is the same fault 525 was written to end, surviving
-- inside 525.
--
-- Nothing stuck: the test raised, the transaction rolled back, and Cassandra
-- reads Manghum. Jimmy, 9 October: "moving forward every single itty bitty
-- piece of this build needs to be tested, confirmed and working without
-- fail." This is what that sentence is for.

begin;

-- ============================================================================
-- THE AUTHORITATIVE NAME, AND THE SPLIT MADE TO MATCH IT
-- ============================================================================
--
-- One name is decided first - from users.first_name + users.last_name where
-- those exist, otherwise users.display_name, otherwise users.full_name. Then
-- display_name, first_name and last_name are all made to agree with it.
--
-- RE-SPLIT ONLY WHEN THE EXISTING SPLIT NO LONGER RECONSTRUCTS THE NAME.
-- This matters and it is the whole reason this is not a naive split_part.
--
--   Cassandra: profile holds "Cassandra" + "Manghun", which rebuilds as
--   "Cassandra Manghun". The authoritative name is "Cassandra Manghum". They
--   disagree, so the split is redone: first "Cassandra", last "Manghum".
--
--   A three-part name: profile holds "Mary Jane" + "Smith", which rebuilds
--   as "Mary Jane Smith", and the authoritative name is "Mary Jane Smith".
--   They agree, so NOTHING IS TOUCHED. A blind split would have moved Jane
--   into the surname and quietly renamed her.
--
-- Where a re-split is unavoidable, first word to first_name and everything
-- after it to last_name. That keeps Johnson-Witcher and Badger-Brown whole,
-- which is the common case here, and it only ever runs on a record that is
-- already provably wrong.

create or replace function public.employee_profile_follows_login()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  u        record;
  v_name   text;
  v_first  text;
  v_last   text;
begin
  select lower(x.email) as email,
         nullif(btrim(coalesce(x.first_name, '')), '') as first_name,
         nullif(btrim(coalesce(x.last_name, '')), '')  as last_name,
         nullif(btrim(coalesce(x.display_name, '')), '') as display_name,
         nullif(btrim(coalesce(x.full_name, '')), '')    as full_name
    into u
    from public.employees e
    join public.users x on x.id = e.user_id
   where e.id = new.employee_id
     and x.email is not null;

  /* No login yet. Whatever was typed stands - a half-recorded person is not
     made worse, and the link trigger re-asks the moment one is made. */
  if not found then
    return new;
  end if;

  /* The work email is the sign-in address. Always, not only when blank. */
  new.contact_email := u.email;

  /* ONE AUTHORITATIVE NAME, decided in this order. */
  v_name := coalesce(
              nullif(btrim(coalesce(u.first_name,'') || ' ' || coalesce(u.last_name,'')), ''),
              u.display_name,
              u.full_name
            );

  /* public.users carries no name at all. Leave the HR record alone rather
     than blanking a name that is the only one anybody has. */
  if v_name is null then
    return new;
  end if;

  new.display_name := v_name;

  if u.first_name is not null or u.last_name is not null then
    /* Split names exist upstream. Take them. */
    new.first_name := coalesce(u.first_name, new.first_name);
    new.last_name  := coalesce(u.last_name,  new.last_name);

  elsif btrim(coalesce(new.first_name,'') || ' ' || coalesce(new.last_name,'')) is distinct from v_name then
    /* The split on record no longer rebuilds the real name. Redo it. */
    v_first := split_part(v_name, ' ', 1);
    v_last  := nullif(btrim(substr(v_name, length(v_first) + 1)), '');
    new.first_name := v_first;
    new.last_name  := v_last;
  end if;
  /* else: the split already rebuilds the name exactly. Touch nothing. */

  return new;
end $fn$;

comment on function public.employee_profile_follows_login() is
  'A person has one name and one work address, and it is the one they sign in with. Rewritten 9 October 2026 by migration 527: the 525 version coalesced onto users.first_name and users.last_name, which are null for twelve of thirteen people, so first_name and last_name were never actually guarded - an adversarial test put Manghun straight back. Now one authoritative name is decided first and the three columns are made to agree with it, re-splitting only when the stored split no longer rebuilds that name, so a three-part name is left intact.';

revoke all on function public.employee_profile_follows_login() from public, anon, authenticated;

/* Through the trigger again, so first_name and last_name land under the new
   rule as well. A no-op for everybody already correct. */
update public.employee_profiles
   set display_name = display_name
 where employee_id in (select id from public.employees where user_id is not null);

commit;

-- ============================================================================
-- WHAT TO RUN AFTERWARDS
-- ============================================================================
--
-- The same adversarial test, which must now fail to put the typo back. It
-- rolls itself back either way:
--
--     C:\Projects\JAG-GA-CLEAN\does_the_name_guard_actually_hold.sql
--
-- ============================================================================
-- THE REAL ANSWER IS STILL UPSTREAM
-- ============================================================================
--
-- public.users holds a name in full_name and nothing in first_name or
-- last_name for everyone except Leesa Davis. That is its own duplication -
-- four name columns on users (first_name, last_name, display_name,
-- full_name), three of them empty - and this function now has to guess
-- around it.
--
-- Deciding which of those four columns is the name, and emptying the other
-- three, is a quiet-morning job. It is not urgent now, because the guessing
-- is contained in one function and that function is tested.
