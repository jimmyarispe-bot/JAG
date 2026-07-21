-- =========================================
-- RC-6.04 — Tenant-scope integration_connections RLS
-- Permission alone is insufficient; require org membership.
-- (Renumbered from 179 → 181: 179 was claimed by RC-2.02 Google Workspace sync.)
-- =========================================

drop policy if exists integration_connections_select on public.integration_connections;
create policy integration_connections_select on public.integration_connections
  for select to authenticated
  using (
    is_organization_member(organization_id)
    and (
      has_permission('integration.view')
      or has_permission('integration.manage')
      or has_permission('integration.admin')
      or has_permission('configuration.manage')
      or has_permission('configuration.admin')
    )
  );

drop policy if exists integration_connections_write on public.integration_connections;
create policy integration_connections_write on public.integration_connections
  for all to authenticated
  using (
    is_organization_member(organization_id)
    and (
      has_permission('integration.manage')
      or has_permission('integration.admin')
      or has_permission('configuration.manage')
      or has_permission('configuration.admin')
    )
  )
  with check (
    is_organization_member(organization_id)
    and (
      has_permission('integration.manage')
      or has_permission('integration.admin')
      or has_permission('configuration.manage')
      or has_permission('configuration.admin')
    )
  );
