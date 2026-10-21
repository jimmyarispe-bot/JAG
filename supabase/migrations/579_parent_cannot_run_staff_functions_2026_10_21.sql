-- 579: A parent-only login cannot run the staff database functions.
--
-- Tables are locked (578), but SECURITY DEFINER functions run as their owner
-- and read past table rules. These nine can be called by any signed-in user
-- and none checks who is calling. The worst: detect_admission_duplicates
-- returns other families' names; mint_application_access_token makes an
-- application link for any child. Each now refuses a parent-only login as
-- its first statement. Staff, the service role and public forms (anon) are
-- unchanged: is_parent_only(null) is false.

begin;

do $$
declare
  f record;
  def text;
  guarded text;
begin
  for f in
    select p.oid
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'detect_admission_duplicates', 'mint_application_access_token',
        'ensure_state_funding_verifications', 'sync_application_checklist',
        'seed_admissions_checklist_for_school', 'generate_student_number',
        'generate_employee_number', 'refresh_billing_account_aging',
        'provision_auth_user'
      )
  loop
    def := pg_get_functiondef(f.oid);
    if position('is_parent_only' in def) > 0 then
      continue; -- already guarded
    end if;
    guarded := regexp_replace(
      def,
      '\mBEGIN\M',
      E'BEGIN\n  IF public.is_parent_only(auth.uid()) THEN\n    RAISE EXCEPTION ''Not available to a parent account'' USING ERRCODE = ''42501'';\n  END IF;',
      'i');
    if guarded = def then
      raise exception 'Could not find BEGIN in %', f.oid::regprocedure;
    end if;
    execute guarded;
  end loop;
end $$;

-- A parent's own first sign-in heals its account through
-- provision_current_auth_user -> provision_auth_user(self). That must work.
do $$
declare def text; fixed text;
begin
  select pg_get_functiondef('public.provision_auth_user(uuid,text,text,jsonb)'::regprocedure) into def;
  fixed := replace(def, 'IF public.is_parent_only(auth.uid()) THEN',
    'IF public.is_parent_only(auth.uid()) AND p_user_id IS DISTINCT FROM auth.uid() THEN');
  if fixed <> def then execute fixed; end if;
end $$;

commit;
