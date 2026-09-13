-- ===========================================================================
-- WHY THE PARENT CANNOT START THE APPLICATION
-- 13 September 2026. READ ONLY — this transaction never commits.
-- ===========================================================================
--
-- WHERE WE ARE. Migration 350 fixed the RLS recursion, and Lana Robinson can
-- now sign in and see Savannah's enquiry in the portal. Two things on that card
-- are still wrong:
--
--   "School · —"                 the campus name is blank
--   "School year unavailable"    and the Start Application button is disabled
--
-- The component renders `lead.schools?.name ?? "School"`, so the campus join
-- came back empty. The button is disabled when getCurrentSchoolYear returns
-- nothing:
--
--     const { data } = await supabase.from("school_years")
--       .eq("school_id", schoolId).eq("is_current", true).maybeSingle();
--     return data;                      // error discarded, same as before
--
-- TWO CAUSES, IDENTICAL SYMPTOM. Either there is genuinely no current school
-- year for that campus, or a PARENT cannot read schools and school_years at
-- all. Both produce silent nothing. This tells them apart by asking the same
-- questions twice — once as the owner, who sees everything, and once as Lana.
--
--   owner sees a row + Lana does not  -> RLS. The parent is locked out.
--   neither sees a row                -> data. No current year is set.
--
-- HOW TO READ IT. Finishes by raising the report as an error on purpose, since
-- that is the only output the SQL editor shows reliably from a block that
-- catches its own failures. THE RED BOX IS THE ANSWER.
-- ===========================================================================

do $$
declare
  v_uid     uuid;
  v_lead    uuid;
  v_school  uuid;
  report    text := '';
  n         bigint;
  v_name    text;
  pol       record;
begin
  select id into v_uid
  from public.users
  where lower(email) = 'jimmy.arispe@gmail.com'
  limit 1;

  select l.id, l.school_id into v_lead, v_school
  from public.admissions_leads l
  where l.first_name = 'Savannah' and l.last_name = 'Robinson'
  order by l.created_at
  limit 1;

  if v_uid is null or v_lead is null then
    raise exception 'Could not find the parent account or the lead — nothing to compare.';
  end if;

  -- -------------------------------------------------------------------------
  -- A. AS THE OWNER. What is actually there, with RLS out of the way.
  -- -------------------------------------------------------------------------
  report := report || E'\n=== A. AS OWNER (the truth, whatever RLS says) ===\n';
  report := report || format(E'  lead   %s\n  school %s\n', v_lead, coalesce(v_school::text, 'NULL ON THE LEAD'));

  select name into v_name from public.schools where id = v_school;
  report := report || format(E'  schools row            %s\n', coalesce(v_name, 'NOT FOUND'));

  select count(*) into n from public.school_years where school_id = v_school;
  report := report || format(E'  school_years rows      %s\n', n);

  select count(*) into n
  from public.school_years where school_id = v_school and is_current = true;
  report := report || format(E'  of those, is_current   %s   <-- the button needs exactly 1\n', n);

  -- If more than one is current, maybeSingle() returns an error, not a row —
  -- which the discarded `error` would hide just as effectively as no row.
  if n > 1 then
    report := report || E'  WARNING: more than one current year. maybeSingle() errors on that.\n';
  end if;

  for pol in
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public' and tablename in ('schools', 'school_years')
    order by tablename, policyname
  loop
    report := report || format(E'  policy  %-14s %-44s [%s]\n', pol.tablename, pol.policyname, pol.cmd);
  end loop;

  -- -------------------------------------------------------------------------
  -- B. AS LANA. The same questions, through her session.
  -- -------------------------------------------------------------------------
  report := report || E'\n=== B. AS THE PARENT ===\n';

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_uid::text, 'role', 'authenticated', 'aud', 'authenticated')::text,
    true
  );
  set local role authenticated;

  begin
    select count(*) into n from public.admissions_leads where id = v_lead;
    report := report || format(E'  1. her lead                    OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  1. her lead                    FAIL  %s %s\n', sqlstate, left(sqlerrm,80));
  end;

  begin
    select count(*) into n from public.schools where id = v_school;
    report := report || format(E'  2. the campus                  OK    %s rows   <-- 0 explains "School · —"\n', n);
  exception when others then
    report := report || format(E'  2. the campus                  FAIL  %s %s\n', sqlstate, left(sqlerrm,80));
  end;

  begin
    select count(*) into n from public.school_years where school_id = v_school;
    report := report || format(E'  3. any school year             OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  3. any school year             FAIL  %s %s\n', sqlstate, left(sqlerrm,80));
  end;

  begin
    select count(*) into n
    from public.school_years where school_id = v_school and is_current = true;
    report := report || format(E'  4. the current school year     OK    %s rows   <-- 0 disables the button\n', n);
  exception when others then
    report := report || format(E'  4. the current school year     FAIL  %s %s\n', sqlstate, left(sqlerrm,80));
  end;

  -- The exact shape the portal runs for the campus name.
  begin
    select count(*) into n
    from public.admissions_leads l
    join public.schools s on s.id = l.school_id
    where l.id = v_lead;
    report := report || format(E'  5. lead joined to campus       OK    %s rows   <-- what the portal asks for\n', n);
  exception when others then
    report := report || format(E'  5. lead joined to campus       FAIL  %s %s\n', sqlstate, left(sqlerrm,80));
  end;

  -- Where Start Application would write. If she cannot insert here, the button
  -- would fail even with a school year present.
  begin
    select count(*) into n from public.admissions_applications where lead_id = v_lead;
    report := report || format(E'  6. her applications            OK    %s rows\n', n);
  exception when others then
    report := report || format(E'  6. her applications            FAIL  %s %s\n', sqlstate, left(sqlerrm,80));
  end;

  report := report || E'\n  READ IT LIKE THIS:\n';
  report := report || E'    A shows rows and B shows 0  -> RLS. The parent is locked out.\n';
  report := report || E'    A shows 0 as well           -> data. No current year is set.\n';
  report := report || E'\n  (Nothing was written. This transaction is being rolled back.)\n';

  raise exception E'REPORT — this red box is the result, not a failure:\n%', report;
end $$;
