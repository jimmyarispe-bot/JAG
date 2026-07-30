/**
 * Sprint 207 — Command Center capability discovery wiring.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { JAG_COMMAND_NAV } from "@/components/jag/command-center/nav";
import {
  loadCapabilitiesWorkspace,
  loadJagSearchCatalog,
} from "@/lib/jag-command-center";
import {
  clearCapabilityObservationsForTests,
  resetCapabilitiesForTests,
} from "@/lib/platform/capabilities";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

describe("Capability SDK Command Center (Sprint 207)", () => {
  beforeEach(() => {
    clearCapabilityObservationsForTests();
    resetCapabilitiesForTests();
  });

  it("exposes discovered nav including capabilities explorer", () => {
    const hrefs = JAG_COMMAND_NAV.map((n) => n.href);
    expect(hrefs).toContain("/jag/inbox");
    expect(hrefs).toContain("/jag/strategy");
    expect(hrefs).toContain("/jag/capabilities");
  });

  it("loads capabilities workspace", () => {
    const model = loadCapabilitiesWorkspace();
    expect(model.capabilities.length).toBeGreaterThanOrEqual(8);
    expect(model.selectedId).toBeTruthy();
    expect(model.healthDashboard.length).toBe(model.capabilities.length);
  });

  it("includes capability entries in search catalog", () => {
    const catalog = loadJagSearchCatalog(session);
    expect(catalog.some((i) => i.kind === "capability")).toBe(true);
    expect(catalog.some((i) => i.href === "/jag/capabilities")).toBe(true);
  });
});
