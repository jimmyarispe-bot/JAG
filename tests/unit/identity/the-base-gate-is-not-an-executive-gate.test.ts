import { describe, it, expect } from "vitest";
import { permissionsForMappedRole } from "@/lib/platform/identity/permission-groups";
import { visibleModules } from "@/lib/dashboard/module-visibility";
import {
  SIDEBAR_NAV_SECTIONS,
  visibleSectionItems,
} from "@/lib/dashboard/intelligence-navigation";
import { DASHBOARD_MODULES } from "@/lib/dashboard/navigation";

/**
 * 21 September 2026. A test teacher signed in and her sidebar carried
 * Executive Workspace, Mission Control, Briefings, KPIs, Board Reports,
 * Forecasting, Risk, Scenarios, Decisions, Recommendations, Strategy,
 * Benchmarks, Capacity and Intelligence Network - plus the School Leader
 * module.
 *
 * The cause was not the sidebar and not the database. ACADEMYOS_ACCESS, the
 * group that means "you may use the platform", also granted
 * mission_control.access, executive.dashboard, executive.intelligence and
 * school.configure. TEAM_MEMBER maps to that group and nothing else, and
 * TEAM_MEMBER is what provisioning gives every new user before anyone assigns
 * them a real role.
 *
 * Four database queries could not see it, because permissionsForMappedRole()
 * never touches the database.
 *
 * These tests assert the OUTCOME a person sees, not the shape of the map, so
 * they keep holding if the map is refactored.
 */

const EXECUTIVE_KEYS = [
  "executive.dashboard",
  "executive.intelligence",
  "mission_control.access",
] as const;

describe("the base gate is not an executive gate", () => {
  it("TEAM_MEMBER receives no executive permission", () => {
    const granted = permissionsForMappedRole("TEAM_MEMBER");
    for (const key of EXECUTIVE_KEYS) {
      expect(granted, `TEAM_MEMBER must not receive ${key}`).not.toContain(key);
    }
  });

  it("TEACHER receives no executive permission", () => {
    const granted = permissionsForMappedRole("TEACHER");
    for (const key of EXECUTIVE_KEYS) {
      expect(granted, `TEACHER must not receive ${key}`).not.toContain(key);
    }
  });

  it("a teacher's sidebar has no Executive or Intelligence section", () => {
    const permissions = permissionsForMappedRole("TEACHER");
    const drawn = SIDEBAR_NAV_SECTIONS.flatMap((section) =>
      visibleSectionItems(section, permissions).map((item) => item.label)
    );
    expect(drawn).toEqual([]);
  });

  it("a newly provisioned TEAM_MEMBER sees no Executive or Intelligence section", () => {
    const permissions = permissionsForMappedRole("TEAM_MEMBER");
    const drawn = SIDEBAR_NAV_SECTIONS.flatMap((section) =>
      visibleSectionItems(section, permissions).map((item) => item.label)
    );
    expect(drawn).toEqual([]);
  });

  it("a teacher does not see the School Leader module", () => {
    // students.view is how a teacher opens her own roster. It can never be
    // the permission that reveals somebody else's module.
    const permissions = permissionsForMappedRole("TEACHER");
    const ids = visibleModules(DASHBOARD_MODULES, permissions).map((m) => m.id);
    expect(ids).not.toContain("school-leader");
  });

  it("a teacher still sees Teacher Studio", () => {
    // The failure mode of over-tightening: a teacher who can see nothing.
    const permissions = permissionsForMappedRole("TEACHER");
    const ids = visibleModules(DASHBOARD_MODULES, permissions).map((m) => m.id);
    expect(ids).toContain("teacher");
  });

  it("a School Leader still sees the School Leader module", () => {
    // Heather Badger-Brown and Nina Gaddy on a Monday morning. school.configure
    // reaches them as a platform_role_permissions row from migration 074, so
    // the mapped set alone is not the whole story - assert on the key that the
    // database grants them.
    const ids = visibleModules(DASHBOARD_MODULES, ["school.configure"]).map(
      (m) => m.id
    );
    expect(ids).toContain("school-leader");
  });

  it("the Founder still sees everything", () => {
    const permissions = permissionsForMappedRole("FOUNDER");
    const drawn = SIDEBAR_NAV_SECTIONS.flatMap((section) =>
      visibleSectionItems(section, permissions).map((item) => item.label)
    );
    expect(drawn).toContain("Executive Workspace");
    expect(drawn).toContain("Mission Control");
  });

  it("PLATFORM_OWNER and JAG_ORG_ADMIN keep the executive suite", () => {
    // Danni Treu and Stacy Kenworthy reach these through JAG_ACCESS and
    // JAG_ORG_ACCESS, not through the base gate.
    for (const role of ["PLATFORM_OWNER", "JAG_ORG_ADMIN"]) {
      const granted = permissionsForMappedRole(role);
      expect(granted, `${role} must keep executive.dashboard`).toContain(
        "executive.dashboard"
      );
    }
  });
});
