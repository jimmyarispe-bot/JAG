/**
 * Sprint 208 — Command Center graph + conversation explainability wiring.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { JAG_COMMAND_NAV } from "@/components/jag/command-center/nav";
import {
  loadGraphWorkspace,
  loadJagSearchCatalog,
  routeConversationIntent,
} from "@/lib/jag-command-center";
import {
  clearCapabilityObservationsForTests,
  resetCapabilitiesForTests,
} from "@/lib/platform/capabilities";
import { resetExplainabilityForTests } from "@/lib/platform/intelligence/explain/index";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

const session: JagPlatformSession = {
  userId: "jag-user-founder",
  email: "founder@jag.platform",
  displayName: "JAG Founder",
  role: "FOUNDER",
  issuedAt: "2026-01-01T00:00:00.000Z",
};

describe("Explainability Graph Command Center (Sprint 208)", () => {
  beforeEach(() => {
    resetExplainabilityForTests();
    clearCapabilityObservationsForTests();
    resetCapabilitiesForTests();
  });

  it("discovers Graph navigation via Capability SDK", () => {
    const hrefs = JAG_COMMAND_NAV.map((n) => n.href);
    expect(hrefs).toContain("/jag/graph");
  });

  it("loads graph workspace for session org", () => {
    const model = loadGraphWorkspace(session, { depth: "2" });
    expect(model.advisoryNotice.toLowerCase()).toContain("reasoning");
    if (model.organizationId) {
      expect(model.graph).not.toBeNull();
      expect(model.graph!.nodes.length).toBeGreaterThan(0);
    }
  });

  it("routes explainability conversation intents", () => {
    expect(
      routeConversationIntent("Why did you recommend this?").intent
    ).toBe("explainability");
    expect(routeConversationIntent("Show the reasoning.").intent).toBe(
      "explainability"
    );
    expect(
      routeConversationIntent("What evidence supports this?").intent
    ).toBe("explainability");
    expect(
      routeConversationIntent("What assumptions were made?").intent
    ).toBe("explainability");
  });

  it("includes reasoning and evidence in search catalog", () => {
    const catalog = loadJagSearchCatalog(session);
    expect(catalog.some((i) => i.href === "/jag/graph")).toBe(true);
    expect(catalog.some((i) => i.kind === "reasoning")).toBe(true);
    expect(catalog.some((i) => i.kind === "evidence")).toBe(true);
  });
});
