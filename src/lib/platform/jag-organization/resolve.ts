import {
  buildJagOrganizationTree,
  filterVisibleOrganizationTree,
} from "@/lib/platform/jag-organization/hierarchy-tree";
import type {
  JagOrgActiveScope,
  JagOrgHierarchySnapshot,
  JagOrganizationContext,
  JagOrgReportingChain,
} from "@/lib/platform/jag-organization/types";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface ResolveJagOrganizationOptions {
  supabase?: AuthClient | null;
  employeeUserId?: string;
}

async function loadHierarchySnapshot(
  supabase: AuthClient,
  organizationId: string | null
): Promise<JagOrgHierarchySnapshot> {
  const orgQuery = supabase.from("org_organizations").select("id, name, slug");

  const { data: org } = organizationId
    ? await orgQuery.eq("id", organizationId).maybeSingle()
    : await orgQuery.eq("slug", "the-academy-way").maybeSingle();

  const [{ data: regions }, { data: schools }, { data: campuses }, { data: programs }, { data: departments }] =
    await Promise.all([
      supabase.from("org_regions").select("id, name, code").order("name"),
      supabase.from("schools").select("id, name, organization_id, region_id").order("name"),
      supabase.from("campuses").select("id, school_id, name, code, is_primary").order("name"),
      supabase.from("org_programs").select("id, school_id, name, code").order("name"),
      supabase.from("org_departments").select("id, school_id, campus_id, name, code").order("name"),
    ]);

  return {
    organization: org ? { id: org.id, name: org.name, slug: org.slug } : null,
    regions: regions ?? [],
    schools: schools ?? [],
    campuses: (campuses ?? []).map((c) => ({
      id: c.id,
      school_id: c.school_id,
      name: c.name,
      is_primary: c.is_primary,
      code: c.code,
    })),
    programs: programs ?? [],
    departments: departments ?? [],
  };
}

async function resolveOrganizationIdForSchool(
  supabase: AuthClient,
  schoolId: string | null
): Promise<string | null> {
  if (!schoolId) return null;
  const { data } = await supabase
    .from("schools")
    .select("organization_id")
    .eq("id", schoolId)
    .maybeSingle();
  return data?.organization_id ?? null;
}

async function loadEmployeeReporting(
  supabase: AuthClient,
  userId: string,
  snapshot: JagOrgHierarchySnapshot,
  activeScope: JagOrgActiveScope
): Promise<JagOrgReportingChain> {
  const { data: employee } = await supabase
    .from("employees")
    .select("id, school_id")
    .eq("user_id", userId)
    .eq("employment_status", "active")
    .maybeSingle();

  if (!employee) {
    return { employeeId: null, positions: [], chain: buildReportingChainFromScope(activeScope) };
  }

  const { data: eps } = await supabase
    .from("employee_positions")
    .select("is_primary, positions(id, title, department)")
    .eq("employee_id", employee.id);

  const positions = (eps ?? []).map((ep) => {
    const pos = Array.isArray(ep.positions) ? ep.positions[0] : ep.positions;
    return {
      id: (pos as { id?: string } | null)?.id ?? `pos-${ep.is_primary}`,
      title: (pos as { title?: string } | null)?.title ?? "Staff",
      department: (pos as { department?: string | null } | null)?.department ?? null,
      isPrimary: ep.is_primary,
    };
  });

  const primary = positions.find((p) => p.isPrimary) ?? positions[0] ?? null;
  const chain = buildReportingChainFromScope(activeScope, primary?.title ?? null, primary?.department ?? null);

  return { employeeId: employee.id, positions, chain };
}

function buildReportingChainFromScope(
  scope: JagOrgActiveScope,
  positionTitle?: string | null,
  departmentLabel?: string | null
): JagOrgReportingChain["chain"] {
  const chain: JagOrgReportingChain["chain"] = [];

  if (positionTitle) {
    chain.push({
      id: "position-active",
      kind: "position",
      name: positionTitle,
    });
  }

  if (scope.departmentId && scope.departmentName) {
    chain.push({
      id: scope.departmentId,
      kind: "department",
      name: scope.departmentName,
    });
  } else if (departmentLabel) {
    chain.push({
      id: "department-label",
      kind: "department",
      name: departmentLabel,
    });
  }

  if (scope.schoolId && scope.schoolName) {
    chain.push({ id: scope.schoolId, kind: "school", name: scope.schoolName });
  }

  if (scope.organizationId && scope.organizationName) {
    chain.push({
      id: scope.organizationId,
      kind: "organization",
      name: scope.organizationName,
    });
  }

  return chain;
}

function resolveActiveScope(
  identity: IdentityContext,
  snapshot: JagOrgHierarchySnapshot,
  primary: IdentityContext["orgAssignments"][number] | null
): JagOrgActiveScope {
  const schoolId = primary?.school_id ?? identity.accessibleSchoolIds[0] ?? null;
  const school = snapshot.schools.find((s) => s.id === schoolId) ?? null;
  const region = school?.region_id
    ? snapshot.regions.find((r) => r.id === school.region_id) ?? null
    : null;

  const campusId = primary?.campus_id ?? null;
  const campus = campusId ? snapshot.campuses.find((c) => c.id === campusId) ?? null : null;

  const programId = primary?.program_id ?? null;
  const program = programId ? snapshot.programs.find((p) => p.id === programId) ?? null : null;

  const departmentId = primary?.department_id ?? null;
  const department = departmentId
    ? snapshot.departments.find((d) => d.id === departmentId) ?? null
    : null;

  return {
    organizationId: snapshot.organization?.id ?? school?.organization_id ?? null,
    organizationName: snapshot.organization?.name ?? null,
    regionId: region?.id ?? school?.region_id ?? null,
    regionName: region?.name ?? null,
    schoolId,
    schoolName: school?.name ?? primary?.schools?.name ?? null,
    campusId,
    campusName: campus?.name ?? null,
    programId,
    programName: program?.name ?? null,
    departmentId,
    departmentName: department?.name ?? null,
    positionTitle: null,
  };
}

function resolveVisibility(
  identity: IdentityContext,
  snapshot: JagOrgHierarchySnapshot
): JagOrganizationContext["visibility"] {
  const accessibleSchoolIds = identity.accessibleSchoolIds;
  const hasUnrestricted = identity.hasUnrestrictedSchoolAccess || identity.isEnterpriseAdmin;

  const schoolSet = new Set(accessibleSchoolIds);
  const campusIds = snapshot.campuses
    .filter((c) => hasUnrestricted || schoolSet.has(c.school_id))
    .map((c) => c.id);
  const programIds = snapshot.programs
    .filter((p) => hasUnrestricted || schoolSet.has(p.school_id))
    .map((p) => p.id);
  const departmentIds = snapshot.departments
    .filter((d) => hasUnrestricted || schoolSet.has(d.school_id))
    .map((d) => d.id);

  for (const a of identity.orgAssignments) {
    if (a.campus_id && (a.all_campuses || a.campus_id)) {
      if (a.campus_id) campusIds.push(a.campus_id);
    }
    if (a.program_id && (a.all_programs || a.program_id)) {
      if (a.program_id) programIds.push(a.program_id);
    }
    if (a.department_id) departmentIds.push(a.department_id);
  }

  return {
    accessibleSchoolIds,
    accessibleCampusIds: [...new Set(campusIds)],
    accessibleProgramIds: [...new Set(programIds)],
    accessibleDepartmentIds: [...new Set(departmentIds)],
    hasUnrestrictedAccess: hasUnrestricted,
  };
}

function resolveAuthority(identity: IdentityContext): JagOrganizationContext["authority"] {
  const inherited = new Set<string>();
  const granted = [...identity.permissions];

  for (const a of identity.orgAssignments) {
    if (a.all_campuses || a.all_programs) {
      for (const p of identity.permissions) {
        inherited.add(p);
      }
    }
  }

  if (identity.isEnterpriseAdmin) {
    for (const p of identity.permissions) {
      inherited.add(p);
    }
  }

  return {
    assignmentScopes: identity.orgAssignments.map((a) => ({
      schoolId: a.school_id,
      campusId: a.campus_id,
      programId: a.program_id,
      departmentId: a.department_id,
      allCampuses: a.all_campuses,
      allPrograms: a.all_programs,
      isPrimary: a.is_primary,
    })),
    grantedPermissions: granted,
    inheritedPermissions: [...inherited],
  };
}

function resolveOwnership(
  activeScope: JagOrgActiveScope
): JagOrganizationContext["ownership"] {
  const orgOwner: JagOrganizationContext["ownership"]["organizationalOwner"] =
    activeScope.departmentId && activeScope.departmentName
      ? { id: activeScope.departmentId, kind: "department", name: activeScope.departmentName }
      : activeScope.schoolId && activeScope.schoolName
        ? { id: activeScope.schoolId, kind: "school", name: activeScope.schoolName }
        : activeScope.organizationId && activeScope.organizationName
          ? { id: activeScope.organizationId, kind: "organization", name: activeScope.organizationName }
          : { id: "enterprise", kind: "organization", name: "Enterprise" };

  return {
    organizationalOwner: orgOwner,
    knowledgeOwnerKeys: [],
    workflowOwnerKeys: [],
    financialOwner: {
      schoolId: activeScope.schoolId,
      departmentId: activeScope.departmentId,
      label: activeScope.schoolName ?? activeScope.organizationName ?? "Enterprise",
    },
  };
}

function emptySnapshot(): JagOrgHierarchySnapshot {
  return {
    organization: null,
    regions: [],
    schools: [],
    campuses: [],
    programs: [],
    departments: [],
  };
}

/** Identity-only resolution — safe for tests and offline pipeline steps. */
export function buildJagOrganizationContextFromIdentity(
  identity: IdentityContext
): JagOrganizationContext {
  const primary =
    identity.orgAssignments.find((a) => a.is_primary) ?? identity.orgAssignments[0] ?? null;
  const snapshot = emptySnapshot();
  if (primary?.schools?.name && primary.school_id) {
    snapshot.schools.push({
      id: primary.school_id,
      name: primary.schools.name,
      organization_id: null,
    });
  }
  const activeScope = resolveActiveScope(identity, snapshot, primary);
  const tree = buildJagOrganizationTree(snapshot);
  const visibleTree = filterVisibleOrganizationTree(
    tree,
    identity.accessibleSchoolIds,
    identity.hasUnrestrictedSchoolAccess || identity.isEnterpriseAdmin
  );

  return {
    resolvedAt: new Date().toISOString(),
    schoolId: activeScope.schoolId,
    organizationId: activeScope.organizationId,
    primaryAssignment: primary,
    accessibleSchoolIds: identity.accessibleSchoolIds,
    hasUnrestrictedSchoolAccess: identity.hasUnrestrictedSchoolAccess,
    hierarchy: { snapshot, tree, visibleTree },
    activeScope,
    reporting: {
      employeeId: null,
      positions: [],
      chain: buildReportingChainFromScope(activeScope),
    },
    ownership: resolveOwnership(activeScope),
    authority: resolveAuthority(identity),
    visibility: resolveVisibility(identity, snapshot),
  };
}

/** Authoritative async resolver — composes identity, org DB, and employee reporting. */
export async function resolveJagOrganizationContext(
  identity: IdentityContext,
  options: ResolveJagOrganizationOptions = {}
): Promise<JagOrganizationContext> {
  const base = buildJagOrganizationContextFromIdentity(identity);
  if (!options.supabase) return base;

  try {
    const primary = base.primaryAssignment;
    const schoolId = primary?.school_id ?? identity.accessibleSchoolIds[0] ?? null;
    const organizationId = await resolveOrganizationIdForSchool(options.supabase, schoolId);
    const snapshot = await loadHierarchySnapshot(options.supabase, organizationId);
    const activeScope = resolveActiveScope(identity, snapshot, primary);
    const tree = buildJagOrganizationTree(snapshot);
    const visibleTree = filterVisibleOrganizationTree(
      tree,
      identity.accessibleSchoolIds,
      identity.hasUnrestrictedSchoolAccess || identity.isEnterpriseAdmin
    );

    const userId = options.employeeUserId ?? identity.effectiveUserId;
    const reporting = await loadEmployeeReporting(options.supabase, userId, snapshot, activeScope);

    const primaryPosition = reporting.positions.find((p) => p.isPrimary) ?? reporting.positions[0];
    activeScope.positionTitle = primaryPosition?.title ?? null;

    return {
      ...base,
      resolvedAt: new Date().toISOString(),
      schoolId: activeScope.schoolId,
      organizationId: activeScope.organizationId,
      hierarchy: { snapshot, tree, visibleTree },
      activeScope,
      reporting,
      ownership: resolveOwnership(activeScope),
      visibility: resolveVisibility(identity, snapshot),
    };
  } catch {
    return base;
  }
}
