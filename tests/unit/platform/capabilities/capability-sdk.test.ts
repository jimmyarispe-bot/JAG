/**
 * Sprint 207 — Intelligence Capability SDK tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CapabilityLoader,
  CapabilityRegistry,
  CapabilityService,
  clearCapabilityObservationsForTests,
  ensureCapabilitiesRegistered,
  listCapabilityObservations,
  parseCapabilityVersion,
  resetCapabilitiesForTests,
  satisfiesVersion,
  type CapabilityManifest,
} from "@/lib/platform/capabilities";

describe("Intelligence Capability SDK (Sprint 207)", () => {
  beforeEach(() => {
    clearCapabilityObservationsForTests();
    resetCapabilitiesForTests();
  });

  afterEach(() => {
    CapabilityRegistry.resetForTests();
    clearCapabilityObservationsForTests();
  });

  it("bootstraps Phase II intelligence capabilities", () => {
    ensureCapabilitiesRegistered();
    const list = CapabilityRegistry.list();
    expect(list.length).toBeGreaterThanOrEqual(9);
    expect(
      list.some((c) => c.manifest.id === "jag.intelligence.watchers")
    ).toBe(true);
    expect(
      list.some((c) => c.manifest.id === "jag.intelligence.strategy")
    ).toBe(true);
  });

  it("discovers navigation without hard-coded intelligence duplicates", () => {
    const nav = CapabilityLoader.discoverNavigation();
    const ids = nav.map((n) => n.id);
    expect(ids).toContain("overview");
    expect(ids).toContain("chat");
    expect(ids).toContain("inbox");
    expect(ids).toContain("decisions");
    expect(ids).toContain("briefings");
    expect(ids).toContain("scenarios");
    expect(ids).toContain("memory");
    expect(ids).toContain("strategy");
    expect(ids).toContain("capabilities");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("discovers conversation, briefing, and watcher providers", () => {
    expect(CapabilityLoader.discoverConversationProviders().length).toBeGreaterThan(
      0
    );
    expect(CapabilityLoader.discoverBriefingProviders().length).toBeGreaterThan(0);
    expect(CapabilityLoader.discoverWatcherProviders().length).toBeGreaterThan(0);
  });

  it("validates version ranges and reports healthy capabilities", () => {
    const v = parseCapabilityVersion("1.2.0")!;
    expect(satisfiesVersion(v, ">=1.0.0")).toBe(true);
    expect(satisfiesVersion(v, "^1.0.0")).toBe(true);
    expect(satisfiesVersion(v, "2.0.0")).toBe(false);

    const health = CapabilityLoader.discoverHealth();
    expect(health.every((h) => h.health.status === "healthy")).toBe(true);
  });

  it("detects missing and circular dependencies", () => {
    const orphan: CapabilityManifest = {
      id: "jag.test.orphan",
      name: "Orphan",
      version: parseCapabilityVersion("1.0.0")!,
      description: "Test",
      category: "custom",
      enabled: true,
      routes: [],
      navigation: [],
      permissions: { required: [], optional: [] },
      dependencies: [
        { capabilityId: "jag.test.missing", versionRange: ">=1.0.0" },
      ],
      providers: {},
      featureFlags: {},
      metadata: { tags: ["test"], owner: "test" },
    };
    CapabilityRegistry.register(orphan);
    const issues = CapabilityRegistry.validateDependencies();
    expect(issues.some((i) => i.kind === "missing")).toBe(true);

    const a: CapabilityManifest = {
      ...orphan,
      id: "jag.test.a",
      name: "A",
      dependencies: [{ capabilityId: "jag.test.b", versionRange: ">=1.0.0" }],
    };
    const b: CapabilityManifest = {
      ...orphan,
      id: "jag.test.b",
      name: "B",
      dependencies: [{ capabilityId: "jag.test.a", versionRange: ">=1.0.0" }],
    };
    CapabilityRegistry.register(a);
    CapabilityRegistry.register(b);
    const circular = CapabilityRegistry.validateDependencies();
    expect(circular.some((i) => i.kind === "circular")).toBe(true);
  });

  it("builds capability explorer model", () => {
    const explorer = CapabilityService.explorer();
    expect(explorer.capabilities.length).toBeGreaterThanOrEqual(9);
    expect(explorer.navigation.some((n) => n.href === "/jag/capabilities")).toBe(
      true
    );
    expect(explorer.advisoryNotice).toMatch(/self-register/i);
  });

  it("records registration observability", () => {
    const kinds = new Set(listCapabilityObservations().map((o) => o.kind));
    expect(kinds.has("capability_registration")).toBe(true);
  });
});
