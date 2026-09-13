-- ===========================================================================
-- WHERE EXACTLY DOES A PARENT'S READ RECURSE?
-- 13 September 2026. READ ONLY — this transaction never commits.
-- ===========================================================================
--
-- WHAT HAPPENED. Lana Robinson activated a parent account, landed on
-- /apply/portal, and saw "No inquiries found". Her email matches the guardian
-- row exactly, so the match is not the problem. Reproducing her session in SQL
-- returned:
--
--     ERROR: 54001: stack depth limit exceeded
--     CONTEXT: SQL function "has_role" during startup
--              SQL function "has_role" statement 1     (x ~700)
--
-- THE LOOP I BELIEVE IS THERE, from the migrations:
--
--   policy user_roles_select_access on public.user_roles   (migration 182)
--     using ( user_id = auth.uid()
--             or has_permission('users.view')
--             or has_permission('users.manage')
--             or has_role('CEO')            <-- here
--             or has_role('FOUNDER') )      <-- and here
--
--   function has_role(text)                                (migration 009)
--     language sql, stable, SECURITY INVOKER
--     select exists (select 1 from user_roles ur join roles r ... )
--                                 ^^^^^^^^^^ back through the policy above
--
-- has_role reads the very table whose policy calls has_role, and it is
-- security INVOKER, so the read is subject to that policy again. Nothing stops
-- it.
--
-- WHY NO STAFF MEMBER HAS EVER HIT THIS. The OR short-circuits left to right.
-- has_permission IS security definer, so its own reads bypass RLS and it
-- answers without recursing — and for staff it answers TRUE. Evaluation stops
-- there and never reaches has_role. A PARENT gets false from both
-- has_permission branches, falls through to has_role('CEO'), and the floor
-- gives way.
--
-- That is why this surfaced tonight and not in the preceding year: Lana is the
-- first non-staff account ever to sign in.
--
-- WHY I AM NOT ASSERTING IT YET. The repo checkout is missing 84 migrations
-- (the sequence runs 236 -> 321), so the policy text above is what the repo
-- says, not necessarily what production runs. Section A prints the policies
-- production actually has. Section B then walks a parent's read one step at a
-- time and reports which steps survive and which blow the stack.
--
-- HOW TO READ THE RESULT. This deliberately finishes by raising the report as
-- an error, because that is the only output the SQL editor shows reliably from
-- a block that catches its own failures. THE RED BOX IS THE ANSWER. Nothing is
-- written, and nothing needs undoing.
-- ===========================================================================

do $$
declare
  v_uid    uuid;
  v_lead   uuid;
  v_email  text;
  report   text := '';
  n        bigint;
  b        boolean;
  pol      record;

  procedure_note text;
begin
  -- -------------------------------------------------------------------------
  -- A. What production actually has. Read as owner, before dropping privilege.
  -- -------------------------------------------------------------------------
  report := report || E'\n=== A. POLICIES ON public.user_roles (live) ===\n';
  for pol in
    select policyname, cmd, coalesce(qual, '(none)') as qual
    from pg_policies
    where schemaname = 'public' and tablename = 'user_roles'
    order by policyname
  loop
    report := report || format(E'  %s [%s]\n      %s\n',
      pol.policyname, pol.cmd, replace(pol.qual, E'\n', ' '));
  end loop;

  report := report || E'\n=== A2. has_role: is it security definer? ===\n';
  select case when p.prosecdef then 'SECURITY DEFINER' else 'security INVOKER' end
    into procedure_note
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'has_role'
  limit 1;
  report := report || format(E'  has_role  -> %s\n', coalesce(procedure_note, 'NOT FOUND'));

  select case when p.prosecdef then 'SECURITY DEFINER' else 'security INVOKER' end
    into procedure_note
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'has_permission'
  limit 1;
  report := report || format(E'  has_permission -> %s\n', coalesce(procedure_note, 'NOT FOUND'));

  select case when p.prosecdef then 'SECURITY DEFINER' else 'security INVOKER' end
    into procedure_note
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and p.proname = 'is_guardian_of_lead'
  limit 1;
  report := report || format(E'  is_guardian_of_lead -> %s\n', coalesce(procedure_note, 'NOT FOUND'));

  report := report || E'\n=== A3. FORCE row level security? ===\n';
  report := report || format(E'  user_roles forced = %s\n',
    (select relforcerowsecurity from pg_class where oid = 'public.user_roles'::regclass));

  -- -------------------------------------------------------------------------
  -- Who we are pretending to be.
  -- -------------------------------------------------------------------------
  select id, email into v_uid, v_email
  from public.users
  where lower(email) = 'jimmy.arispe@gmail.com'
  limit 1;

  select l.id into v_lead
  from public.admissions_leads l
  where l.first_name = 'Savannah' and l.last_name = 'Robinson'
  order by l.created_at
  limit 1;

  if v_uid is null then
    raise exception 'No account found for jimmy.arispe@gmail.com — nothing to reproduce.%', report;
  end if;

  report := report || format(E'\n=== B. AS THE PARENT: %s (%s) ===\n', v_email, v_uid);
  report := report || format(E'    lead under test: %s\n\n', coalesce(v_lead::text, 'NOT FOUND'));

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role', 'authenticated', 'aud', 'authenticated')::text,
    true
  );
  set local role authenticated;

  -- 1 -----------------------------------------------------------------------
  begin
    report := report || format(E'  1. auth.uid()                          OK    %s\n', auth.uid());
  exception when others then
    report := report || format(E'  1. auth.uid()                          FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 2 -----------------------------------------------------------------------
  begin
    select count(*) into n from public.roles;
    report := report || format(E'  2. select from roles                   OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  2. select from roles                   FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 3 -----------------------------------------------------------------------
  -- The scan itself. If this survives but step 4 does not, the recursion is
  -- inside has_role's own evaluation, not in reading the table.
  begin
    select count(*) into n from public.user_roles where user_id = auth.uid();
    report := report || format(E'  3. select own rows from user_roles     OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  3. select own rows from user_roles     FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 4 -----------------------------------------------------------------------
  begin
    select public.has_role('PARENT') into b;
    report := report || format(E'  4. has_role(''PARENT'')                  OK    %s\n', b);
  exception when others then
    report := report || format(E'  4. has_role(''PARENT'')                  FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 5 -----------------------------------------------------------------------
  begin
    select public.has_permission('users.view') into b;
    report := report || format(E'  5. has_permission(''users.view'')        OK    %s\n', b);
  exception when others then
    report := report || format(E'  5. has_permission(''users.view'')        FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 6 -----------------------------------------------------------------------
  begin
    select count(*) into n from public.users where id = auth.uid();
    report := report || format(E'  6. read own row in users               OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  6. read own row in users               FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 7 -----------------------------------------------------------------------
  begin
    select count(*) into n from public.admissions_leads where id = v_lead;
    report := report || format(E'  7. read the lead                       OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  7. read the lead                       FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 8 -----------------------------------------------------------------------
  begin
    select public.is_guardian_of_lead(v_lead) into b;
    report := report || format(E'  8. is_guardian_of_lead(lead)           OK    %s\n', b);
  exception when others then
    report := report || format(E'  8. is_guardian_of_lead(lead)           FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 9 -----------------------------------------------------------------------
  -- This is the read the portal actually performs.
  begin
    select count(*) into n from public.admissions_lead_guardians where lead_id = v_lead;
    report := report || format(E'  9. read admissions_lead_guardians      OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  9. read admissions_lead_guardians      FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  -- 10 ----------------------------------------------------------------------
  begin
    select count(*) into n
    from public.admissions_leads l
    where exists (
      select 1 from public.admissions_lead_guardians g
      where g.lead_id = l.id
    );
    report := report || format(E'  10. the portal''s own shape             OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  10. the portal''s own shape             FAIL  %s %s\n', sqlstate, left(sqlerrm,90));
  end;

  report := report || E'\n  (Nothing was written. This transaction is being rolled back.)\n';

  raise exception E'REPORT — this red box is the result, not a failure:\n%', report;
end $$;
