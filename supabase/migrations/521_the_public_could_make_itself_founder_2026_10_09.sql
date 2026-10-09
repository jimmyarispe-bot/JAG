-- 521_the_public_could_make_itself_founder_2026_10_09.sql
--
-- Found 9 October 2026 by a security audit of every SECURITY DEFINER function
-- and every table in the public schema.
--
-- NOBODY HAS USED ANY OF THIS. Checked before writing a line: FOUNDER is held
-- by Jimmy Arispe alone; PLATFORM_OWNER by Danni Treu and Stacy Kenworthy;
-- founder_bootstrap_emails contains one address, jimmy.arispe@theacademyway.org;
-- of twenty auth users exactly one carries a role in metadata and it reads
-- SCHOOL_LEADER. This migration closes doors that were open, not a breach.
--
-- ============================================================================
-- PART 1 - A STRANGER COULD HAVE MADE THEMSELVES FOUNDER
-- ============================================================================
--
-- provision_auth_user decided who is a founder from its own fourth argument:
--
--     v_meta := coalesce(p_meta, au.raw_user_meta_data, '{}'::jsonb);
--     ...
--     v_is_founder := exists (... bootstrap email match ...)
--       or lower(coalesce(v_meta->>'bootstrap_role','')) = 'founder'
--       or lower(coalesce(v_meta->>'role','')) = 'founder';
--
-- p_meta is supplied by the caller and COALESCE puts it ahead of the real
-- auth.users metadata. There was no auth.uid() check, no role check, and no
-- comparison of p_user_id against whoever was calling. anon held EXECUTE.
--
-- FOUNDER is not a label. The same function grants it the FOUNDER role,
-- organization membership as 'owner' carrying org.manage and users.manage, a
-- user_schools row for every school, and user_org_assignments with
-- all_campuses and all_programs true. has_permission() short-circuits on
-- FOUNDER. That is every child's record at all four campuses, admissions,
-- finance and teacher pay.
--
-- THERE WERE THREE WAYS IN, AND A GRANT REVOKE ONLY CLOSES ONE.
--
--   1. Call the RPC. Closed by the revoke in Part 3.
--
--   2. Sign up. handle_new_auth_user() is the trigger on auth.users and it
--      passes new.raw_user_meta_data straight through as p_meta. Supabase
--      lets a client set that at signup through options.data. So
--      signUp({ ..., options: { data: { role: 'founder' } } }) granted
--      FOUNDER at the moment the account was created, with no RPC call at
--      all. Only the function body closes this, which is why Part 1 exists.
--
--   3. Edit the list. auth_provisioning_config holds founder_bootstrap_emails
--      and had row-level security off with anon holding INSERT and UPDATE.
--      Anyone could append their own address. Closed in Part 2.
--
-- WHAT CHANGES HERE. Founder is decided only by the configured bootstrap
-- email list, matched against the address in auth.users - never against
-- p_email, and never against metadata of any kind. Caller metadata is still
-- read for a display name, which is cosmetic and cannot grant anything.
--
-- AND THE MISSING-AUTH-ROW PATH IS CLOSED. The old body fell back to p_email
-- when no auth.users row existed, then wrote a public.users row and granted
-- the role anyway - a durable backdoor row waiting for an auth identity to
-- land on it. Reachable only by direct RPC, which is now revoked, but it
-- returns instead of guessing.
--
-- EVERYTHING ELSE IN THIS FUNCTION IS UNCHANGED, deliberately, including the
-- whole comment about why schools are no longer handed out to non-founders.
-- That decision came out of Nina Gaddy's account on 12 September and it is
-- not being revisited at midnight.

create or replace function public.provision_auth_user(
  p_user_id uuid,
  p_email text default null::text,
  p_full_name text default null::text,
  p_meta jsonb default null::jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text;
  v_full_name text;
  v_meta jsonb;
  v_org_id uuid;
  v_org_slug text;
  v_default_role text;
  v_bootstrap_emails text[];
  v_role_name text;
  v_is_founder boolean := false;
  v_primary_school_id uuid;
begin
  if p_user_id is null then
    return;
  end if;

  /*
   * THE ADDRESS COMES FROM auth.users AND NOWHERE ELSE.
   *
   * It used to be coalesce(nullif(btrim(p_email),''), au.email), so a caller
   * could name any address they liked and have the founder test run against
   * it. p_email is now only a fallback for the display name.
   */
  select
    au.email,
    coalesce(
      nullif(btrim(p_full_name), ''),
      nullif(btrim(coalesce(p_meta, au.raw_user_meta_data)->>'full_name'), ''),
      nullif(btrim(coalesce(p_meta, au.raw_user_meta_data)->>'name'), '')
    ),
    coalesce(p_meta, au.raw_user_meta_data, '{}'::jsonb)
  into v_email, v_full_name, v_meta
  from auth.users au
  where au.id = p_user_id;

  /*
   * NO AUTH ROW, NO PROVISIONING. The old body invented one from p_email and
   * carried on, which wrote a public.users row and a role grant for a uuid
   * that had no identity behind it yet.
   */
  if v_email is null then
    return;
  end if;

  -- 1) public.users
  insert into public.users (id, email, full_name)
  values (p_user_id, v_email, v_full_name)
  on conflict (id) do nothing;

  -- 2) Resolve provisioning config
  select
    c.default_org_slug,
    c.default_role_name,
    coalesce(c.founder_bootstrap_emails, '{}'::text[])
  into v_org_slug, v_default_role, v_bootstrap_emails
  from public.auth_provisioning_config c
  where c.id = 1;

  v_org_slug := coalesce(nullif(btrim(v_org_slug), ''), 'the-academy-way');
  v_default_role := coalesce(nullif(btrim(v_default_role), ''), 'TEAM_MEMBER');

  select o.id
  into v_org_id
  from public.org_organizations o
  where o.slug = v_org_slug
  order by o.created_at
  limit 1;

  if v_org_id is null then
    select o.id
    into v_org_id
    from public.org_organizations o
    order by o.created_at
    limit 1;
  end if;

  /*
   * FOUNDER IS THE CONFIGURED LIST, AND ONLY THE CONFIGURED LIST.
   *
   * The two metadata branches that used to sit here -
   *   or lower(coalesce(v_meta->>'bootstrap_role','')) = 'founder'
   *   or lower(coalesce(v_meta->>'role','')) = 'founder'
   * - let the person being provisioned nominate themselves. They are gone.
   *
   * The list itself is now protected by row-level security (Part 2), because
   * a list anybody may append to is not a list, it is a suggestion.
   */
  v_is_founder := exists (
    select 1
    from unnest(v_bootstrap_emails) as e
    where nullif(btrim(e), '') is not null
      and lower(btrim(e)) = lower(v_email)
  );

  v_role_name := case when v_is_founder then 'FOUNDER' else v_default_role end;

  -- Ensure FOUNDER role exists when needed
  if v_is_founder then
    insert into public.roles (name, display_name, description, is_system, sort_order)
    values (
      'FOUNDER',
      'Founder',
      'Highest platform role with JAG and AcademyOS access.',
      true,
      1
    )
    on conflict (name) do nothing;
  end if;

  -- 3) Default (or Founder) role
  insert into public.user_roles (user_id, role_id)
  select p_user_id, r.id
  from public.roles r
  where r.name = v_role_name
  on conflict (user_id, role_id) do nothing;

  -- 4) Organization membership
  if v_org_id is not null then
    insert into public.user_organization_memberships (
      organization_id,
      user_id,
      membership_role,
      status,
      is_primary,
      permissions,
      joined_at
    )
    values (
      v_org_id,
      p_user_id,
      case when v_is_founder then 'owner' else 'member' end,
      'active',
      true,
      case
        when v_is_founder then '["org.view","org.manage","users.view","users.manage"]'::jsonb
        else '["org.view"]'::jsonb
      end,
      now()
    )
    on conflict (organization_id, user_id) do nothing;

    -- SCHOOLS ARE NOT HANDED OUT HERE ANY MORE.
    --
    -- What this used to do: every newly provisioned non-founder was attached to
    -- The Academy FL - by hard-coded uuid, marked is_primary, in the same
    -- transaction that created their public.users row. Before any administrator
    -- had chosen anything. User Management would then add the campus that was
    -- actually selected, so the person ended up with both, and the FL row was
    -- the primary one, which is what every workspace header reads.
    --
    -- Nina Gaddy, 12 September: account created 13:05:00.400126 with FL
    -- attached in the same instant; GA added deliberately four seconds later.
    -- She was assigned to Georgia and could see Florida, and her Admissions
    -- header said "The Academy FL".
    --
    -- Access is not a default. Somebody with no assignment should see nothing
    -- and ask, which is a bad morning; somebody auto-assigned to a campus
    -- nobody granted them sees children's records they were never given, and
    -- nobody finds out. A provisioning trigger is the wrong place to decide
    -- that question, because it runs before the decision has been made.
    --
    -- So non-founders leave here with a role and no campus, and User Management
    -- grants exactly what was ticked.
    --
    -- FOUNDERS still receive every school in the organisation. That is a
    -- configured list of bootstrap emails, not a guess - it is the one case
    -- where the answer genuinely is "all of them". The primary flag now falls
    -- on the oldest school rather than on Florida specifically; no campus is
    -- named in this function any more.
    if v_is_founder then
      select s.id
      into v_primary_school_id
      from public.schools s
      where s.organization_id = v_org_id
      order by s.created_at nulls last, s.name
      limit 1;

      insert into public.user_schools (user_id, school_id)
      select p_user_id, s.id
      from public.schools s
      where s.organization_id = v_org_id
      on conflict (user_id, school_id) do nothing;

      insert into public.user_org_assignments (
        user_id,
        school_id,
        campus_id,
        program_id,
        department_id,
        all_campuses,
        all_programs,
        is_primary
      )
      select
        p_user_id,
        s.id,
        null,
        null,
        null,
        true,
        true,
        (s.id = v_primary_school_id)
      from public.schools s
      where s.organization_id = v_org_id
      on conflict (user_id, school_id, campus_id, program_id, department_id) do nothing;
    end if;

  end if;
end;
$function$;

-- ============================================================================
-- PART 2 - SIX TABLES THE PUBLIC COULD READ, WRITE AND EMPTY
-- ============================================================================
--
-- All six are in the public schema, so PostgREST serves them, and all six
-- grant anon the full set: SELECT, INSERT, UPDATE, DELETE and TRUNCATE. Five
-- rows of real data between them, so the read exposure was small. The write
-- exposure was not:
--
--   iam_audit_events         the IAM audit stream. Its own COMMENT says rows
--                            "must not be updated or deleted". Anyone could
--                            empty it, or fill it with invented entries.
--   auth_provisioning_config founder_bootstrap_emails. Path 3 above.
--   iam_delegations          grants permissions. Anyone could insert one.
--   iam_break_glass_sessions emergency access.
--   scholarship_applications_legacy  has policies, and RLS was never switched
--                            on, so the policies did nothing at all.
--   admissions_retired_templates     archived copies of deleted letters.

alter table public.iam_audit_events               enable row level security;
alter table public.auth_provisioning_config       enable row level security;
alter table public.admissions_retired_templates   enable row level security;
alter table public.scholarship_applications_legacy enable row level security;
alter table public.iam_delegations                enable row level security;
alter table public.iam_break_glass_sessions       enable row level security;

/*
 * FOUR OF THE SIX GET NO POLICY, WHICH MEANS DENY-ALL, AND THAT IS CORRECT.
 *
 * Traced through the application before switching anything on:
 *
 *   auth_provisioning_config  read only by provision_auth_user(), which is
 *                             SECURITY DEFINER and therefore unaffected.
 *   iam_audit_events          no reader and no writer anywhere in src/.
 *   admissions_retired_templates  written only by migrations 366 and 369.
 *   scholarship_applications_legacy  appears in src/ only as a generated type.
 *
 * THE OTHER TWO NEED A POLICY OR THEY FAIL SILENTLY, which is the whole
 * reason this part is not six one-liners.
 *
 * load-authz-snapshot.ts reads iam_delegations at line 92 and
 * iam_break_glass_sessions at line 106, through the USER-SCOPED client. Both
 * reads sit inside `if (!error)` blocks whose comments read "Table may not
 * exist yet - ignore". Row-level security does not return an error; it
 * returns an empty set. So locking these two with no policy would make
 * delegated authority and break-glass access stop granting anything, with no
 * error, nothing in a log, and nobody told. Exactly the failure shape this
 * whole platform keeps producing.
 *
 * Both tables are empty today, so nothing is relying on them yet. That is the
 * argument for getting the policy right now rather than after somebody does.
 */

create policy iam_delegations_read_own
  on public.iam_delegations
  for select
  to authenticated
  using (auth.uid() = grantee_user_id);

create policy iam_break_glass_read_own
  on public.iam_break_glass_sessions
  for select
  to authenticated
  using (auth.uid() = requester_user_id);

/*
 * READ ONLY, AND ONLY YOUR OWN. Granting a delegation or opening a break-glass
 * session is an administrative act. Neither has a writer in the application
 * today, and when one is built it belongs behind a function that checks who is
 * asking - not behind a policy that lets the grantee write their own grant.
 */

-- ============================================================================
-- PART 3 - FUNCTIONS THE PUBLIC HAD NO BUSINESS CALLING
-- ============================================================================
--
-- Every one of these is SECURITY DEFINER, so it runs past row-level security,
-- and every one was executable by anon - the key that ships inside the browser
-- bundle. None of them is reachable from the only unauthenticated page the JAG
-- has, which is the interest form at /apply. That form uses
-- submit_public_admissions_inquiry, list_schools_for_public_inquiry and
-- list_programs_for_public_inquiry, and none of those is touched here.
--
-- FROM PUBLIC AS WELL AS FROM anon, where both grants exist. Several of these
-- carry a bare "=X/postgres" in proacl - a grant to PUBLIC - alongside the
-- explicit anon grant. Revoking from anon alone would have left the privilege
-- in place through PUBLIC and looked like it had worked. authenticated holds
-- its own explicit grant in every case and keeps access.

revoke execute on function public.provision_auth_user(uuid, text, text, jsonb)
  from public, anon;

/*
 * THE TOKEN MINTER. Given a lead id it returns that family's application
 * access token, and mints one if none exists - so it worked on every lead,
 * not only those already invited. No caller check of any kind.
 *
 * RLS on admissions_leads is correct: anon has no SELECT path, and the only
 * non-authenticated policy is is_guardian_of_lead(id). This function walked
 * straight past a control that was properly built.
 *
 * authenticated keeps EXECUTE because gates/actions.ts:335 calls it as a
 * signed-in member of staff. That is still too wide - any signed-in user can
 * mint any family's token, a parent included - and it wants an internal
 * is_guardian_of_lead() or admissions_staff_can_manage() check. That is a
 * code change with a screen behind it, not a grant, so it is not in this file.
 */
revoke execute on function public.mint_application_access_token(uuid)
  from public, anon;

/*
 * THE ENROLLMENT ORACLE. detect_admission_duplicates reads admissions_leads,
 * students and guardians past RLS and returns names and ids.
 *
 * The email and phone branches never reference the name arguments at all, so
 * junk names plus one real address answered: does this family have a child
 * applying here, what is that child's full name, and where in admissions does
 * the child currently sit. A guardian's email or a phone number was enough,
 * and both are low-entropy and often public.
 */
revoke execute on function public.detect_admission_duplicates(text, text, text, text, date, uuid)
  from public, anon;

/* How far behind a named family is on tuition - current, 30, 60, 90, 120+ -
   returned to anybody holding a billing account id. It writes, too. */
revoke execute on function public.refresh_billing_account_aging(uuid)
  from public, anon;

/* Unauthenticated writes. seed_admissions_checklist_for_school upserts
   fourteen rows for any school id and its ON CONFLICT DO UPDATE overwrites
   label, category, is_required and sort_order - so a school's customised
   admissions checklist silently reverted to the hard-coded defaults on every
   call. sync_application_checklist calls it, reachable with an application id
   instead. Both bypass a can_access_school() policy that was correctly
   written. */
revoke execute on function public.seed_admissions_checklist_for_school(uuid)
  from public, anon;
revoke execute on function public.sync_application_checklist(uuid)
  from public, anon;
revoke execute on function public.ensure_state_funding_verifications(uuid)
  from public, anon;

/* Roster and payroll headcount per campus, to anybody with a school id - and
   school ids are handed out by list_schools_for_public_inquiry by design. */
revoke execute on function public.generate_student_number(uuid)
  from public, anon;
revoke execute on function public.generate_employee_number(uuid)
  from public, anon;

-- ============================================================================
-- WHAT IS DELIBERATELY NOT IN THIS FILE
-- ============================================================================
--
-- check_rate_limit_bucket(text, integer, integer). The caller supplies
-- p_limit, so the limit is whatever the attacker says it is, and no function
-- in the database calls it - the value travels from the client. It is also
-- a lockout: an attacker who guesses the key scheme can run a legitimate
-- user's bucket to its ceiling. All true, and it is still not revoked here,
-- because I could not confirm whether /apply calls it anonymously, and
-- breaking the public interest form at midnight to fix a rate limiter that
-- does not work anyway is a bad trade. It needs the limit and window moved
-- server-side, looked up by key, which is a code change.
--
-- is_platform_steward(uuid), user_can_access_school(uuid, uuid),
-- user_can_access_organization(uuid, uuid) and
-- is_enterprise_admin_for_organization(uuid, uuid). Each takes somebody
-- else's user id and answers a question about them with no caller check -
-- one bit per call, useful mainly for finding who the founder is. They are
-- NOT revoked because they are called from inside row-level security
-- policies, and a policy that calls a function the current role may not
-- execute raises "permission denied for function" rather than returning
-- false. Revoking them could break anonymous paths outright. They want an
-- internal auth.uid() comparison instead, and that is a separate migration
-- written in daylight with the policies that use them in front of it.
--
-- Leaked-password protection is a dashboard setting, not SQL:
-- Authentication -> Sign In / Providers.
--
-- And the question that sets the severity of Part 1, which cannot be answered
-- from SQL: whether "Allow new users to sign up" is enabled on this project.
-- If it is, path 2 was one signup form away. Check it tonight.
