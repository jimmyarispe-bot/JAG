export type AcademyTenantContext = {
  userId: string | null;
  organizationId: string | null;
  applicationId: string;
  roles: string[];
  permissions: string[];
};

/**
 * Bridges AcademyOS identity needs to JAG platform IAM.
 * Does not duplicate authentication logic.
 */
export type IdentityProvider = {
  readonly id: "jag" | "static";
  getCurrentUserId(): Promise<string | null>;
  getCurrentOrganizationId(): Promise<string | null>;
  getCurrentApplicationId(): Promise<string>;
  getRoles(): Promise<string[]>;
  getPermissions(): Promise<string[]>;
  /** Permission evaluation context for application gates. */
  getPermissionContext(): Promise<{
    userId: string | null;
    organizationId: string | null;
    applicationId: string;
    permissions: ReadonlySet<string>;
  }>;
  getTenantContext(): Promise<AcademyTenantContext>;
  hasPermission(permission: string): Promise<boolean>;
};
