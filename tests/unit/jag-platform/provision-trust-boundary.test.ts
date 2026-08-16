import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { authorizeRoute } from "@/lib/platform/identity/route-authorization";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import {
  buildJagOnlyAuthMetadata,
  jagOnlyAuthMetadataHasPrivilegeSignals,
  JAG_ONLY_PROVISION_RPC,
  JAG_PLATFORM_GRANT_ROLE,
  JAG_PLATFORM_USERS_PATH,
  JIMMY_ARISPE_JAG_ROLES,
  STACY_KENWORTHY_ACADEMYOS_ROLES,
  STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES,
  academyOsRolesFrom,
  jagPlatformAccessRolesFrom,
} from "@/lib/jag-platform/platform-access";

const ROOT = process.cwd();

function read(path: string) {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("migration 224 trust boundary", () => {
  const migration = read(
    "supabase/migrations/224_jag_platform_skip_default_org.sql"
  );
  const provision175 = read(
    "supabase/migrations/175_complete_auth_user_provisioning.sql"
  );
  const service = read("src/lib/jag-platform/platform-users.ts");
  const academyCreate = read("src/lib/platform/identity/user-management.ts");

  it("does not replace provision_auth_user or trust client metadata for privileges", () => {
    expect(migration).not.toMatch(/create or replace function public\.provision_auth_user/i);
    expect(migration).not.toMatch(/skip_default_org_membership/);
    expect(migration).not.toMatch(/invite_organization_id/);
    expect(migration).not.toMatch(
      /v_meta->>'role'[\s\S]{0,80}platform_owner/i
    );
    expect(migration).not.toMatch(/raw_user_meta_data->>'role'/);
    expect(migration).toContain(JAG_ONLY_PROVISION_RPC);
    expect(migration).toContain("jag_identity_skips_default_org");
    expect(migration).toMatch(
      /create or replace function public\.provision_current_auth_user/i
    );
    expect(migration).toMatch(/grant execute[\s\S]*to service_role/i);
    expect(migration).toMatch(/revoke all[\s\S]*from authenticated/i);
    expect(migration).toMatch(/revoke all[\s\S]*from anon/i);
    expect(migration).toMatch(/revoke all[\s\S]*from public/i);
  });

  it("blocks PLATFORM_OWNER / PLATFORM_ADMIN / FOUNDER from metadata-driven assignment", () => {
    expect(migration).toContain("v_role not in ('PLATFORM_OWNER', 'PLATFORM_ADMIN')");
    expect(migration).toContain("raise exception");
    expect(migration).not.toMatch(/if v_role = 'FOUNDER'/);
    expect(service).not.toMatch(/skip_default_org_membership:\s*true/);
    expect(service).toContain("buildJagOnlyAuthMetadata");
  });

  it("client-controlled skip_default_org_membership is not a provisioning switch", () => {
    expect(migration).not.toContain("skip_default_org_membership");
    const meta = buildJagOnlyAuthMetadata({
      firstName: "Ada",
      lastName: "Lovelace",
      fullName: "Ada Lovelace",
    });
    expect(jagOnlyAuthMetadataHasPrivilegeSignals(meta)).toBe(false);
    expect(
      jagOnlyAuthMetadataHasPrivilegeSignals({
        ...meta,
        skip_default_org_membership: true,
        role: "PLATFORM_OWNER",
        invite_organization_id: "5ea08717-765a-4ec0-953d-9fdac619f1a1",
      })
    ).toBe(true);
  });

  it("client-controlled invite_organization_id is not implemented in 224", () => {
    expect(migration).not.toContain("invite_organization_id");
    expect(service).not.toContain("invite_organization_id");
  });

  it("authorized JAG-only provisioning uses the service-role RPC and strips only default org bind", () => {
    expect(service).toContain(`admin.rpc(${"JAG_ONLY_PROVISION_RPC"}`);
    expect(service).toContain("p_strip_default_org: true");
    expect(migration).toContain("p_strip_default_org");
    expect(migration).toContain("v_has_protected_role");
    expect(migration).toContain("CEO");
    expect(migration).toContain("FOUNDER");
  });

  it("JAG-only path does not require a fake JAG organization", () => {
    expect(service).not.toContain("the-academy-way");
    expect(service).not.toContain("organizationId");
    expect(migration).not.toContain("the-academy-way");
  });

  it("AcademyOS provisioning still requires organization membership", () => {
    expect(academyCreate).toContain('return fail("Organization is required")');
    expect(academyCreate).toContain("user_organization_memberships");
    expect(academyCreate).toContain("organization_id: input.organizationId");
    expect(provision175).toContain("insert into public.user_organization_memberships");
    expect(provision175).toContain("the-academy-way");
  });

  it("keeps existing Founder bootstrap constrained to 175 (not broadened by 224)", () => {
    expect(provision175).toContain("founder_bootstrap_emails");
    expect(provision175).toContain("lower(coalesce(v_meta->>'role', '')) = 'founder'");
    expect(provision175).not.toMatch(/platform_owner/i);
    expect(provision175).not.toMatch(/platform_admin/i);
    expect(migration).not.toContain("founder_bootstrap_emails");
    expect(migration).not.toContain("bootstrap_role");
    expect(migration).not.toContain("v_meta");
  });

  it("authorized JAG Platform Users actions still require JAG_ACCESS + JAG_PLATFORM_ADMIN", () => {
    expect(service).toContain('requirePermission(supabase, "JAG_PLATFORM_ADMIN")');
    expect(service).toContain('requirePermission(supabase, "JAG_ACCESS")');
    const page = read("src/app/jag/(portal)/users/page.tsx");
    expect(page).toContain("requireJagPlatformAdminSession");
    expect(page).toContain('userHasPermission(supabase, "JAG_PLATFORM_ADMIN")');
  });

  it("existing JAG user-management authorization remains enforced", () => {
    expect(
      authorizeRoute(buildAuthzSnapshot("ceo", ["CEO"]), JAG_PLATFORM_USERS_PATH)
        .ok
    ).toBe(false);
    expect(
      authorizeRoute(
        buildAuthzSnapshot("staff", ["JAG_ORG_STAFF"]),
        JAG_PLATFORM_USERS_PATH
      ).ok
    ).toBe(false);
    expect(
      authorizeRoute(
        buildAuthzSnapshot("jimmy", [...JIMMY_ARISPE_JAG_ROLES]),
        JAG_PLATFORM_USERS_PATH
      ).ok
    ).toBe(true);
    expect(JAG_PLATFORM_GRANT_ROLE).toBe("PLATFORM_OWNER");
  });

  it("does not alter Stacy or Jimmy role models", () => {
    expect(jagPlatformAccessRolesFrom(JIMMY_ARISPE_JAG_ROLES)).toEqual([
      "FOUNDER",
    ]);
    expect(academyOsRolesFrom(STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES)).toEqual([
      "CEO",
    ]);
    expect(STACY_KENWORTHY_ACADEMYOS_ROLES).toEqual(["CEO"]);
    expect(STACY_KENWORTHY_AFTER_JAG_GRANT_ROLES).toEqual([
      "CEO",
      "PLATFORM_OWNER",
    ]);
    expect(service).not.toContain("93be2b6d-e806-4b3a-bc96-92cc4e4ac53b");
    expect(service).not.toContain("33cc3e3a-78f9-4865-b389-37d8258ba2d8");
    expect(migration).not.toContain("93be2b6d-e806-4b3a-bc96-92cc4e4ac53b");
    expect(migration).not.toContain("33cc3e3a-78f9-4865-b389-37d8258ba2d8");
  });
});
