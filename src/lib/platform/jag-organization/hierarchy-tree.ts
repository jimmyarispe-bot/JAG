import type { JagOrgHierarchySnapshot, JagOrgTreeNode } from "@/lib/platform/jag-organization/types";

function node(
  id: string,
  kind: JagOrgTreeNode["kind"],
  name: string,
  parentId: string | null,
  code?: string | null
): JagOrgTreeNode {
  return { id, kind, name, code, parentId, children: [] };
}

/** Build enterprise hierarchy tree: organization → region → school → campus → program/department. */
export function buildJagOrganizationTree(snapshot: JagOrgHierarchySnapshot): JagOrgTreeNode[] {
  const roots: JagOrgTreeNode[] = [];

  const orgRoot = snapshot.organization
    ? node(snapshot.organization.id, "organization", snapshot.organization.name, null, snapshot.organization.slug)
    : null;

  if (orgRoot) roots.push(orgRoot);

  const regionNodes = new Map<string, JagOrgTreeNode>();
  for (const region of snapshot.regions) {
    const parentId = orgRoot?.id ?? null;
    const rNode = node(region.id, "division", region.name, parentId, region.code);
    regionNodes.set(region.id, rNode);
    if (orgRoot) orgRoot.children.push(rNode);
    else roots.push(rNode);
  }

  const schoolNodes = new Map<string, JagOrgTreeNode>();
  for (const school of snapshot.schools) {
    const parentId =
      (school.region_id && regionNodes.get(school.region_id)?.id) ??
      orgRoot?.id ??
      null;
    const sNode = node(school.id, "school", school.name, parentId);
    schoolNodes.set(school.id, sNode);

    const parent = parentId ? findNode(orgRoot ? [orgRoot] : roots, parentId) : null;
    if (parent) parent.children.push(sNode);
    else roots.push(sNode);
  }

  for (const campus of snapshot.campuses) {
    const school = schoolNodes.get(campus.school_id);
    if (!school) continue;
    school.children.push(
      node(campus.id, "campus", campus.name, school.id, campus.code ?? null)
    );
  }

  for (const program of snapshot.programs) {
    const school = schoolNodes.get(program.school_id);
    if (!school) continue;
    school.children.push(
      node(program.id, "program", program.name, school.id, program.code)
    );
  }

  for (const dept of snapshot.departments) {
    const school = schoolNodes.get(dept.school_id);
    if (!school) continue;
    const parentId = dept.campus_id ?? school.id;
    const parent = findNode(orgRoot ? [orgRoot] : roots, parentId) ?? school;
    parent.children.push(
      node(dept.id, "department", dept.name, parent.id, dept.code)
    );
    parent.children.push(
      node(`team-${dept.id}`, "team", dept.name, dept.id, dept.code)
    );
  }

  return orgRoot ? [orgRoot] : roots;
}

function findNode(nodes: JagOrgTreeNode[], id: string): JagOrgTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

/** Filter tree to nodes visible under the user's accessible schools. */
export function filterVisibleOrganizationTree(
  tree: JagOrgTreeNode[],
  accessibleSchoolIds: string[],
  hasUnrestricted: boolean
): JagOrgTreeNode[] {
  if (hasUnrestricted) return tree;

  const allowed = new Set(accessibleSchoolIds);

  function prune(nodes: JagOrgTreeNode[]): JagOrgTreeNode[] {
    const out: JagOrgTreeNode[] = [];
    for (const n of nodes) {
      if (n.kind === "school" && !allowed.has(n.id)) continue;
      const children = prune(n.children);
      if (n.kind === "organization" || n.kind === "division" || n.kind === "region") {
        if (children.length === 0 && n.kind !== "organization") continue;
        out.push({ ...n, children });
        continue;
      }
      if (n.kind === "school" || children.length > 0 || n.kind === "campus" || n.kind === "program" || n.kind === "department" || n.kind === "team") {
        out.push({ ...n, children });
      }
    }
    return out;
  }

  return prune(tree);
}
