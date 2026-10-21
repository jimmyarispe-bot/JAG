-- 580: The parent lock (578) covers writing as well as reading.
--
-- 578 stopped a parent-only login reading other tables. Some write rules let
-- anyone signed in add rows that have no school on them (templates, mission
-- control, workflows). A parent must not be able to write those either. The
-- lock becomes FOR ALL: read, add, change, delete. The same ten tables stay
-- open (their own login records, role names, their contract packet and
-- signatures, MFA settings, the school brand), still limited to their own
-- rows by the existing rules.

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
      'create policy parent_lock on public.%I as restrictive for all to authenticated '
      'using (not (select public.is_parent_only(auth.uid()))) '
      'with check (not (select public.is_parent_only(auth.uid())))',
      t.relname);
  end loop;
end $$;

commit;
