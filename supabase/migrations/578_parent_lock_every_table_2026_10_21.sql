-- 578: A parent-only login reads nothing outside its own account.
--
-- The proof test after 577 found tables whose read rule lets anyone signed in
-- see rows with no school or organization on them (templates, activity,
-- insights, pay rates, playbooks). Rather than chase each one, every table
-- gets one extra rule that must ALSO pass: "the reader is not a parent-only
-- login". Restrictive rules are ANDed with the existing ones, so staff are
-- unchanged. All views are security_invoker, so they inherit this.
--
-- Kept open to parents (their own rows only, by the existing rules): their
-- login records, the role names, their contract packet and signatures, and
-- the school's brand (logo and colors on the contract page).

begin;

do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
      and c.relname not in (
        'users', 'user_roles', 'roles',
        'user_organization_memberships', 'user_org_assignments', 'user_schools',
        'user_mfa_settings',
        'enrollment_packets', 'enrollment_packet_signatures',
        'organization_brands'
      )
  loop
    execute format('drop policy if exists parent_lock on public.%I', t.relname);
    execute format(
      'create policy parent_lock on public.%I as restrictive for select to authenticated '
      'using (not (select public.is_parent_only(auth.uid())))',
      t.relname);
  end loop;
end $$;

commit;
