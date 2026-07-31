import {
  ACADEMYOS_PERMISSION_KEYS,
  ACADEMYOS_PERMISSION_ROLE_PACKS,
  type AcademyPermissionRolePack,
} from "@/applications/academyos/permissions/roles";

const roleRegistry = new Map<string, AcademyPermissionRolePack>();

export function resetAcademyPermissionsForTests(): void {
  roleRegistry.clear();
}

/** Register AcademyOS permission role packs (app configuration → IAM keys). */
export function registerAcademyPermissions(): AcademyPermissionRolePack[] {
  roleRegistry.clear();
  for (const pack of ACADEMYOS_PERMISSION_ROLE_PACKS) {
    roleRegistry.set(pack.id, { ...pack, permissions: [...pack.permissions] });
  }
  return listAcademyPermissionRoles();
}

export function listAcademyPermissionRoles(): AcademyPermissionRolePack[] {
  return [...roleRegistry.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function getAcademyPermissionRole(
  id: string
): AcademyPermissionRolePack | null {
  return roleRegistry.get(id) ?? null;
}

export {
  ACADEMYOS_PERMISSION_KEYS,
  ACADEMYOS_PERMISSION_ROLE_PACKS,
};
export type { AcademyPermissionRoleId, AcademyPermissionRolePack } from "@/applications/academyos/permissions/roles";
