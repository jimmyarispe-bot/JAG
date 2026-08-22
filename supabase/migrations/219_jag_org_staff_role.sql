-- Sprint 219 — Narrow dual-product staff role (JAG + AcademyOS only).
-- Forward-only. Does not create users or send invitations.
--
-- Grants ONLY the catalog gates JAG_ORG_ACCESS + ACADEMYOS_ACCESS (plus the
-- keys those groups already expand to in the app mapping). Never REPORTING,
-- FINANCE, USER_MANAGEMENT, JAG_ACCESS, or JAG_PLATFORM_ADMIN.
--
-- Org-scoped JAG entry still requires an active row in
-- user_organization_memberships for the target organization (existing
-- membership mechanism; this migration does not weaken RLS).

-- ---------------------------------------------------------------------------
-- 1) Role (internal name is never a user-facing product label)
-- ---------------------------------------------------------------------------
insert into public.roles (name, display_name, description, is_system, sort_order)
values
  (
    'JAG_ORG_STAFF',
    'Staff',
    'Organization staff with org-scoped JAG and AcademyOS access only.',
    true,
    46
  )
on conflict (name) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  is_system = true,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 2) Role → permission grants (platform_role_permissions)
-- ---------------------------------------------------------------------------
insert into public.platform_role_permissions (role_id, permission_key, effect)
select r.id, p.permission_key, 'allow'
from public.roles r
cross join public.platform_permissions p
where r.name = 'JAG_ORG_STAFF'
  and p.permission_key in (
    -- Catalog gates
    'JAG_ORG_ACCESS',
    'ACADEMYOS_ACCESS',
    -- Expanded keys from JAG_ORG_ACCESS + ACADEMYOS_ACCESS groups (app mapping)
    'org.view',
    'directory.view',
    'mission_control.access',
    'workflows.view',
    'school.configure',
    'search.global',
    'executive.dashboard',
    'executive.intelligence',
    'executive.risk_view',
    'certification.view',
    'LISTENING_VIEW',
    'LISTENING_MANAGE',
    'LISTENING_ANALYZE',
    'LISTENING_RAW'
  )
on conflict (role_id, permission_key) do nothing;
