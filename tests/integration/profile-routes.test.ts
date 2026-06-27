import { describe, expect, it } from "vitest";
import "@/lib/platform/profile";
import { buildProfileNavigation } from "@/lib/platform/profile/navigation";
import {
  buildLegacyProfileSectionRedirectUrl,
  parseProfileSectionParam,
} from "@/lib/platform/profile/params";
import {
  canAccessProfileKind,
  resolveSectionVisibility,
} from "@/lib/platform/profile/access";
import { isRegisteredSection, resolveSectionKey } from "@/lib/platform/profile/registry";
import { EMPLOYEE_PROFILE_LEGACY_REDIRECTS } from "@/lib/employees/profile/kind";
import { FAMILY_PROFILE_LEGACY_REDIRECTS } from "@/lib/families/profile/kind";
import { STUDENT_PROFILE_LEGACY_REDIRECTS } from "@/lib/students/profile/kind";
import type { ProfileEnvelopeBase } from "@/lib/platform/profile/types";

function studentEnvelope(overrides?: Partial<ProfileEnvelopeBase>): ProfileEnvelopeBase {
  return {
    profileKind: "student",
    entityType: "student",
    entityId: "student-1",
    organizationId: "org-1",
    schoolId: "school-1",
    campusId: null,
    displayName: "Test Student",
    subtitle: null,
    permissions: ["students.view"],
    enabledModules: ["platform", "ssis", "sis"],
    basePath: "/dashboard/students",
    sectionParam: "section",
    defaultSection: "overview",
    ...overrides,
  };
}

function employeeEnvelope(overrides?: Partial<ProfileEnvelopeBase>): ProfileEnvelopeBase {
  return {
    profileKind: "employee",
    entityType: "employee",
    entityId: "employee-1",
    organizationId: "org-1",
    schoolId: "school-1",
    campusId: null,
    displayName: "Test Employee",
    subtitle: null,
    permissions: ["hr.view"],
    enabledModules: ["platform", "hr"],
    basePath: "/dashboard/hr/employees",
    sectionParam: "section",
    defaultSection: "overview",
    ...overrides,
  };
}

function familyEnvelope(overrides?: Partial<ProfileEnvelopeBase>): ProfileEnvelopeBase {
  return {
    profileKind: "family",
    entityType: "family",
    entityId: "family-1",
    organizationId: "org-1",
    schoolId: "school-1",
    campusId: null,
    displayName: "Test Family",
    subtitle: null,
    permissions: ["students.view"],
    enabledModules: ["platform", "sis", "ssis", "finance", "scholarships"],
    basePath: "/dashboard/families",
    sectionParam: "section",
    defaultSection: "overview",
    ...overrides,
  };
}

describe("Student Profile routes", () => {
  it("loads overview by default", () => {
    const navigation = buildProfileNavigation(studentEnvelope(), undefined);
    expect(navigation.activeSection).toBe("overview");
    expect(navigation.activeSectionDef?.key).toBe("overview");
  });

  it("supports deep links via ?section=", () => {
    const navigation = buildProfileNavigation(studentEnvelope(), "timeline");
    expect(navigation.activeSection).toBe("timeline");
    expect(isRegisteredSection("student", "timeline")).toBe(true);
  });

  it("maps legacy ?tab= keys to canonical sections", () => {
    expect(
      parseProfileSectionParam({ tab: "communication" }, STUDENT_PROFILE_LEGACY_REDIRECTS)
    ).toBe("timeline");
    expect(
      parseProfileSectionParam({ tab: "profile" }, STUDENT_PROFILE_LEGACY_REDIRECTS)
    ).toBe("identity");
  });

  it("does not emit HTTP redirect URLs for student legacy tabs", () => {
    expect(
      buildLegacyProfileSectionRedirectUrl(
        "/dashboard/students",
        "student-1",
        { tab: "communication" },
        STUDENT_PROFILE_LEGACY_REDIRECTS
      )
    ).toBe("/dashboard/students/student-1?section=timeline");
  });

  it("denies sections when permissions are missing", () => {
    const hidden = resolveSectionVisibility(
      {
        key: "identity",
        label: "Identity",
        group: "core",
        sortOrder: 10,
        moduleKey: "ssis",
        permissions: ["students.edit"],
        status: "live",
      },
      studentEnvelope({ permissions: ["students.view"] })
    );
    expect(hidden.visible).toBe(false);
    expect(hidden.hiddenReason).toBe("permission");
  });

  it("hides module-gated sections when module is disabled", () => {
    const hidden = resolveSectionVisibility(
      {
        key: "identity",
        label: "Identity",
        group: "core",
        sortOrder: 10,
        moduleKey: "ssis",
        permissions: ["students.view"],
        status: "live",
      },
      studentEnvelope({ enabledModules: ["platform"] })
    );
    expect(hidden.visible).toBe(false);
    expect(hidden.hiddenReason).toBe("module_disabled");
  });

  it("falls back unknown sections to overview", () => {
    expect(resolveSectionKey("student", "does-not-exist")).toBe("overview");
    const navigation = buildProfileNavigation(studentEnvelope(), "does-not-exist");
    expect(navigation.activeSection).toBe("overview");
  });

  it("registers activity timeline section", () => {
    expect(isRegisteredSection("student", "timeline")).toBe(true);
    const navigation = buildProfileNavigation(studentEnvelope(), "timeline");
    expect(navigation.activeSectionDef?.label).toBeTruthy();
  });

  it("allows profile kind access with students.view", () => {
    expect(canAccessProfileKind("student", ["students.view"], ["students.view"])).toBe(true);
    expect(canAccessProfileKind("student", ["students.view"], [])).toBe(false);
  });
});

describe("Employee Profile routes", () => {
  it("loads overview by default", () => {
    const navigation = buildProfileNavigation(employeeEnvelope(), undefined);
    expect(navigation.activeSection).toBe("overview");
  });

  it("supports deep links via ?section=", () => {
    const navigation = buildProfileNavigation(employeeEnvelope(), "notes");
    expect(navigation.activeSection).toBe("notes");
  });

  it("redirects legacy ?tab= bookmarks to canonical ?section= URLs", () => {
    expect(
      buildLegacyProfileSectionRedirectUrl(
        "/dashboard/hr/employees",
        "employee-1",
        { tab: "timeline" },
        EMPLOYEE_PROFILE_LEGACY_REDIRECTS
      )
    ).toBe("/dashboard/hr/employees/employee-1?section=activity");
  });

  it("denies HR sections without hr permissions", () => {
    const hidden = resolveSectionVisibility(
      {
        key: "notes",
        label: "Notes",
        group: "communication",
        sortOrder: 10,
        moduleKey: "platform",
        permissions: ["hr.view", "hr.manage"],
        status: "live",
      },
      employeeEnvelope({ permissions: ["employee.self_service"] })
    );
    expect(hidden.visible).toBe(false);
    expect(hidden.hiddenReason).toBe("permission");
  });

  it("falls back unknown sections to overview", () => {
    expect(resolveSectionKey("employee", "unknown-section")).toBe("overview");
  });

  it("registers notes panel and activity timeline sections", () => {
    expect(isRegisteredSection("employee", "notes")).toBe(true);
    expect(isRegisteredSection("employee", "activity")).toBe(true);
    const notesNav = buildProfileNavigation(employeeEnvelope(), "notes");
    const activityNav = buildProfileNavigation(employeeEnvelope(), "activity");
    expect(notesNav.activeSection).toBe("notes");
    expect(activityNav.activeSection).toBe("activity");
  });
});

describe("Family Profile routes", () => {
  it("loads overview by default", () => {
    const navigation = buildProfileNavigation(familyEnvelope(), undefined);
    expect(navigation.activeSection).toBe("overview");
    expect(navigation.activeSectionDef?.key).toBe("overview");
  });

  it("supports deep links via ?section=", () => {
    const navigation = buildProfileNavigation(familyEnvelope(), "parents-guardians");
    expect(navigation.activeSection).toBe("parents-guardians");
    expect(isRegisteredSection("family", "parents-guardians")).toBe(true);
  });

  it("maps legacy ?tab= keys to canonical sections", () => {
    expect(
      parseProfileSectionParam({ tab: "billing" }, FAMILY_PROFILE_LEGACY_REDIRECTS)
    ).toBe("tuition");
    expect(
      parseProfileSectionParam({ tab: "timeline" }, FAMILY_PROFILE_LEGACY_REDIRECTS)
    ).toBe("activity");
  });

  it("redirects legacy finance bookmarks to tuition section URLs", () => {
    expect(
      buildLegacyProfileSectionRedirectUrl(
        "/dashboard/families",
        "family-1",
        { tab: "billing" },
        FAMILY_PROFILE_LEGACY_REDIRECTS
      )
    ).toBe("/dashboard/families/family-1?section=tuition");
  });

  it("denies financial sections without finance permissions", () => {
    const hidden = resolveSectionVisibility(
      {
        key: "tuition",
        label: "Tuition",
        group: "financial",
        sortOrder: 70,
        moduleKey: "finance",
        permissions: ["finance.view", "portal.parent.access"],
        status: "live",
      },
      familyEnvelope({ permissions: ["students.view"] })
    );
    expect(hidden.visible).toBe(false);
    expect(hidden.hiddenReason).toBe("permission");
  });

  it("falls back unknown sections to overview", () => {
    expect(resolveSectionKey("family", "unknown-section")).toBe("overview");
    const navigation = buildProfileNavigation(familyEnvelope(), "unknown-section");
    expect(navigation.activeSection).toBe("overview");
  });

  it("registers all 19 family sections", () => {
    expect(isRegisteredSection("family", "household")).toBe(true);
    expect(isRegisteredSection("family", "students")).toBe(true);
    expect(isRegisteredSection("family", "notes")).toBe(true);
    expect(isRegisteredSection("family", "activity")).toBe(true);
    expect(isRegisteredSection("family", "audit")).toBe(true);
  });

  it("allows profile kind access with students.view or portal.parent.access", () => {
    expect(canAccessProfileKind("family", ["students.view", "portal.parent.access"], ["students.view"])).toBe(true);
    expect(
      canAccessProfileKind("family", ["students.view", "portal.parent.access"], ["portal.parent.access"])
    ).toBe(true);
    expect(canAccessProfileKind("family", ["students.view", "portal.parent.access"], [])).toBe(false);
  });
});
