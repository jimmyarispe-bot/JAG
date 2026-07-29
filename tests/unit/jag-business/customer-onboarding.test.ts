/**
 * JAG Business Sprint 001 — customer onboarding journey.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  authenticateJagPlatform,
  JAG_PLATFORM_HOME_PATH,
  JAG_PLATFORM_LOGIN_PATH,
} from "@/lib/jag-platform";
import {
  getProvisionedOrganization,
  listOrganizationsForSession,
  provisionOrganization,
  resetJagBusinessStoreForTests,
  validatePilotWizard,
} from "@/lib/jag-business";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const ROOT = process.cwd();
const MARKETING = join(ROOT, "src", "app", "(marketing)");
const DOCS = join(ROOT, "docs", "jag-business");

const VALID_WIZARD = {
  organizationName: "Northwind Academy",
  industry: "education",
  country: "United States",
  timeZone: "America/New_York",
  planId: "starter",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@northwind.test",
  password: "secure-pass-1",
  passwordConfirmation: "secure-pass-1",
} as const;

afterEach(() => {
  resetJagBusinessStoreForTests();
});

describe("JAG Business — public website", () => {
  it("exposes marketing routes for the public journey", () => {
    for (const segment of [
      "page.tsx",
      "overview/page.tsx",
      "products/page.tsx",
      "solutions/page.tsx",
      "solutions/[industry]/page.tsx",
      "pricing/page.tsx",
      "about/page.tsx",
      "contact/page.tsx",
      "start/page.tsx",
      "start/success/page.tsx",
    ]) {
      expect(existsSync(join(MARKETING, segment)), `missing ${segment}`).toBe(
        true
      );
    }
  });

  it("Start Your Pilot CTAs target /start", () => {
    const home = readFileSync(
      join(ROOT, "src", "components", "jag-marketing", "HomePage.tsx"),
      "utf8"
    );
    const shell = readFileSync(
      join(ROOT, "src", "components", "jag-marketing", "MarketingShell.tsx"),
      "utf8"
    );
    expect(home).toMatch(/href=["']\/start["']/);
    expect(shell).toMatch(/href=["']\/start["']/);
    expect(shell).toMatch(/Start Your Pilot/);
  });

  it("documents the customer journey under docs/jag-business", () => {
    for (const doc of [
      "01_CUSTOMER_JOURNEY.md",
      "02_SUBSCRIPTION_MODEL.md",
      "03_ORGANIZATION_PROVISIONING.md",
      "04_FOUNDER_ONBOARDING.md",
      "05_WORKSPACE_CREATION.md",
    ]) {
      expect(existsSync(join(DOCS, doc))).toBe(true);
    }
  });
});

describe("JAG Business — wizard validation", () => {
  it("rejects incomplete wizard input", () => {
    const result = validatePilotWizard({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.organizationName).toBeTruthy();
    expect(result.fieldErrors.email).toBeTruthy();
    expect(result.fieldErrors.password).toBeTruthy();
  });

  it("rejects mismatched password confirmation", () => {
    const result = validatePilotWizard({
      ...VALID_WIZARD,
      passwordConfirmation: "different",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.passwordConfirmation).toMatch(/do not match/i);
  });

  it("accepts a complete wizard payload", () => {
    const result = validatePilotWizard(VALID_WIZARD);
    expect(result.ok).toBe(true);
  });
});

describe("JAG Business — provisioning & login", () => {
  it("provisions organization, founder, workspace, and subscription", () => {
    const result = provisionOrganization(VALID_WIZARD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const org = result.organization;
    expect(org.organizationId).toMatch(/^org\./);
    expect(org.organizationName).toBe("Northwind Academy");
    expect(org.founder.email).toBe("ada@northwind.test");
    expect(org.founder.firstName).toBe("Ada");
    expect(org.workspace.workspaceId).toMatch(/^workspace\./);
    expect(org.workspace.name).toContain("Northwind Academy");
    expect(org.subscription.planId).toBe("starter");
    expect(org.subscription.status).toBe("pilot");
    expect(org.settings.productAvailability).toBe("academyos_only");

    expect(getProvisionedOrganization(org.organizationId)?.organizationId).toBe(
      org.organizationId
    );
  });

  it("rejects duplicate founder email", () => {
    expect(provisionOrganization(VALID_WIZARD).ok).toBe(true);
    const second = provisionOrganization(VALID_WIZARD);
    expect(second.ok).toBe(false);
  });

  it("authenticates the provisioned founder and lists their organization", () => {
    const provisioned = provisionOrganization(VALID_WIZARD);
    expect(provisioned.ok).toBe(true);
    if (!provisioned.ok) return;

    const auth = authenticateJagPlatform({
      email: VALID_WIZARD.email,
      password: VALID_WIZARD.password,
    });
    expect(auth.ok).toBe(true);
    if (!auth.ok) return;
    expect(auth.session.role).toBe("FOUNDER");
    expect(auth.session.email).toBe("ada@northwind.test");

    const orgs = listOrganizationsForSession(auth.session);
    expect(orgs).toHaveLength(1);
    expect(orgs[0]?.name).toBe("Northwind Academy");
    expect(orgs[0]?.id).toBe(provisioned.organization.organizationId);
  });

  it("redirect path after success targets JAG login then dashboard", () => {
    expect(JAG_PLATFORM_LOGIN_PATH).toBe("/jag/login");
    expect(JAG_PLATFORM_HOME_PATH).toBe("/jag");

    const success = readFileSync(
      join(MARKETING, "start", "success", "page.tsx"),
      "utf8"
    );
    expect(success).toMatch(/Welcome to The JAG™/);
    expect(success).toMatch(/Open The JAG/);
    expect(success).toMatch(/JAG_PLATFORM_LOGIN_PATH/);

    const provisioned = provisionOrganization({
      ...VALID_WIZARD,
      email: "redirect@northwind.test",
    });
    expect(provisioned.ok).toBe(true);
    if (!provisioned.ok) return;

    const session: JagPlatformSession = {
      userId: provisioned.organization.founder.userId,
      email: provisioned.organization.founder.email,
      displayName: "Ada Lovelace",
      role: "FOUNDER",
      issuedAt: new Date().toISOString(),
    };
    const orgs = listOrganizationsForSession(session);
    expect(orgs.some((o) => o.name === "Northwind Academy")).toBe(true);
  });

  it("keeps seeded Academy Way for demo accounts only", () => {
    provisionOrganization(VALID_WIZARD);
    const demoSession: JagPlatformSession = {
      userId: "jag-user-founder",
      email: "founder@jag.platform",
      displayName: "JAG Founder",
      role: "FOUNDER",
      issuedAt: new Date().toISOString(),
    };
    const demoOrgs = listOrganizationsForSession(demoSession);
    expect(demoOrgs.some((o) => o.name === "The Academy Way")).toBe(true);
    expect(demoOrgs.some((o) => o.name === "Northwind Academy")).toBe(true);

    const founderAuth = authenticateJagPlatform({
      email: VALID_WIZARD.email,
      password: VALID_WIZARD.password,
    });
    expect(founderAuth.ok).toBe(true);
    if (!founderAuth.ok) return;
    const founderOrgs = listOrganizationsForSession(founderAuth.session);
    expect(founderOrgs.some((o) => o.name === "The Academy Way")).toBe(false);
    expect(founderOrgs).toHaveLength(1);
  });
});
