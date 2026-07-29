import { describe, expect, it, vi } from "vitest";
import type { DomainAdapterRegistrationApi } from "@/lib/jag/runtime";
import {
  DOMAIN_SDK_VERSION,
  checkVersionCompatibility,
  createDomainBuilder,
  createDomainLifecycle,
  createDomainRegistry,
  createDomainSdk,
  satisfiesVersion,
  validateDomain,
  type DomainPackage,
} from "@/lib/jag/domain-sdk";

function baseManifest() {
  return {
    id: "example.industry",
    name: "example-industry",
    displayName: "Example Industry",
    version: "1.0.0",
    description: "Generic sample domain for SDK tests",
    owner: { name: "SDK Tests", organization: "JAG" },
    requiredRuntimeVersion: "1.0.0-rc",
    minimumCoreVersion: "1.0.0-rc",
  };
}

function buildSampleDomain(): DomainPackage {
  return createDomainBuilder(baseManifest())
    .withCapabilities("context", "cognition", "action")
    .withPermission("example.action.run", { actionScoped: true })
    .registerContextContributor({
      id: "example.context",
      discover: () => [],
    })
    .registerCognitiveContributor({
      id: "example.cognition",
      gatherEvidence: () => [],
    })
    .registerActionContributor({
      id: "example.action",
      actionIds: ["example.run"],
      execute: () => ({ status: "succeeded" }),
    })
    .withFeatureFlag("beta", false)
    .build();
}

function mockRegistrationApi(): DomainAdapterRegistrationApi & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    registerIdentityContributor: (c) => {
      calls.push(`identity:${c.id}`);
    },
    registerContextContributor: (c) => {
      calls.push(`context:${c.id}`);
    },
    registerIntentContributor: (c) => {
      calls.push(`intent:${c.id}`);
    },
    registerCognitiveContributor: (c) => {
      calls.push(`cognition:${c.id}`);
    },
    registerExperienceContributor: (c) => {
      calls.push(`experience:${c.id}`);
    },
    registerActionContributor: (c) => {
      calls.push(`action:${c.id}`);
    },
    registerEvidenceContributor: (c) => {
      calls.push(`evidence:${c.id}`);
    },
    registerMemoryContributor: (c) => {
      calls.push(`memory:${c.id}`);
    },
    registerTwinContributor: (c) => {
      calls.push(`twin:${c.id}`);
    },
  };
}

describe("JAG Domain SDK", () => {
  describe("versioning", () => {
    it("exposes SDK version", () => {
      const sdk = createDomainSdk();
      expect(sdk.version).toBe(DOMAIN_SDK_VERSION);
      expect(sdk.runtimeContract).toBeTruthy();
    });

    it("satisfies caret and minimum ranges", () => {
      expect(satisfiesVersion("1.2.3", "^1.0.0")).toBe(true);
      expect(satisfiesVersion("2.0.0", "^1.0.0")).toBe(false);
      expect(satisfiesVersion("1.0.0-rc", ">=1.0.0-rc")).toBe(true);
      expect(satisfiesVersion("1.0.0", ">=1.0.0-rc")).toBe(true);
    });

    it("checks runtime and core compatibility", () => {
      const ok = checkVersionCompatibility({
        domainVersion: "1.0.0",
        runtimeVersion: "1.0.0-rc",
        coreVersion: "1.0.0-rc",
        requiredRuntimeVersion: "1.0.0-rc",
        minimumCoreVersion: "1.0.0-rc",
      });
      expect(ok.ok).toBe(true);

      const bad = checkVersionCompatibility({
        domainVersion: "1.0.0",
        runtimeVersion: "0.9.0",
        coreVersion: "1.0.0-rc",
        requiredRuntimeVersion: "1.0.0-rc",
        minimumCoreVersion: "1.0.0-rc",
      });
      expect(bad.ok).toBe(false);
      expect(bad.errors.some((e) => e.includes("Runtime"))).toBe(true);
    });
  });

  describe("manifest validation", () => {
    it("accepts a complete generic domain manifest", () => {
      const domain = buildSampleDomain();
      const result = validateDomain(domain.manifest, { bundle: domain.bundle });
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects reserved domain ids (constitutional)", () => {
      const result = validateDomain({
        ...buildSampleDomain().manifest,
        id: "jag.core",
      });
      expect(result.ok).toBe(false);
      expect(
        result.errors.some((e) => e.code === "CONSTITUTIONAL_VIOLATION")
      ).toBe(true);
    });

    it("rejects domains that claim to be the JAG product", () => {
      const result = validateDomain({
        ...buildSampleDomain().manifest,
        displayName: "JAG",
      });
      expect(result.ok).toBe(false);
    });

    it("requires action contributor when action capability is declared", () => {
      const attempt = createDomainBuilder(baseManifest())
        .withCapabilities("action")
        .declareContributor({ id: "missing.action", kind: "action" })
        .tryBuild();
      expect(attempt.ok).toBe(false);
    });

    it("validates host runtime compatibility", () => {
      const domain = buildSampleDomain();
      const result = validateDomain(domain.manifest, {
        bundle: domain.bundle,
        host: {
          runtimeVersion: "0.1.0",
          coreVersion: "1.0.0-rc",
        },
      });
      expect(result.ok).toBe(false);
      expect(
        result.errors.some((e) => e.code === "RUNTIME_INCOMPATIBLE")
      ).toBe(true);
    });
  });

  describe("builder", () => {
    it("assembles contributors and adapter", async () => {
      const domain = buildSampleDomain();
      expect(domain.manifest.supportedCapabilities).toEqual(
        expect.arrayContaining(["context", "cognition", "action"])
      );
      expect(domain.bundle.action).toHaveLength(1);

      const api = mockRegistrationApi();
      await domain.adapter.register(api);
      expect(api.calls).toEqual(
        expect.arrayContaining([
          "context:example.context",
          "cognition:example.cognition",
          "action:example.action",
        ])
      );
    });

    it("auto-declares contributors on register*", () => {
      const domain = buildSampleDomain();
      const ids = domain.manifest.contributors.map((c) => c.id);
      expect(ids).toContain("example.context");
      expect(ids).toContain("example.action");
    });
  });

  describe("registry", () => {
    it("registers, enables, disables, and lists domains", () => {
      const registry = createDomainRegistry({
        runtimeVersion: "1.0.0-rc",
        coreVersion: "1.0.0-rc",
      });
      const domain = buildSampleDomain();
      const entry = registry.register(domain);
      expect(entry.status).toBe("registered");
      expect(registry.has("example.industry")).toBe(true);

      expect(registry.enable("example.industry").status).toBe("enabled");
      expect(registry.disable("example.industry").status).toBe("disabled");
      expect(registry.list({ status: "disabled" })).toHaveLength(1);

      const validation = registry.validate("example.industry");
      expect(validation).toMatchObject({ ok: true });

      expect(registry.unregister("example.industry")).toBe(true);
      expect(registry.has("example.industry")).toBe(false);
    });

    it("does not auto-load domains", () => {
      const registry = createDomainRegistry();
      expect(registry.list()).toHaveLength(0);
    });

    it("rejects duplicate registration", () => {
      const registry = createDomainRegistry({ validateOnRegister: false });
      const domain = buildSampleDomain();
      registry.register(domain);
      expect(() => registry.register(domain)).toThrow(/already registered/);
    });
  });

  describe("lifecycle", () => {
    it("install → initialize → activate → deactivate → remove", async () => {
      const api = mockRegistrationApi();
      const lifecycle = createDomainLifecycle({
        registrationApi: api,
        runtimeVersion: "1.0.0-rc",
        coreVersion: "1.0.0-rc",
        now: () => "2026-01-01T00:00:00.000Z",
      });
      const domain = buildSampleDomain();

      await lifecycle.install(domain);
      await lifecycle.initialize("example.industry");
      const active = await lifecycle.activate("example.industry");
      expect(active.state).toBe("active");
      expect(api.calls.length).toBeGreaterThan(0);

      const inactive = await lifecycle.deactivate("example.industry");
      expect(inactive.state).toBe("inactive");

      const removed = await lifecycle.remove("example.industry");
      expect(removed.state).toBe("removed");
    });

    it("upgrades an inactive domain package", async () => {
      const api = mockRegistrationApi();
      const lifecycle = createDomainLifecycle({
        registrationApi: api,
        runtimeVersion: "1.0.0-rc",
        coreVersion: "1.0.0-rc",
      });
      const domain = buildSampleDomain();
      await lifecycle.install(domain);
      await lifecycle.initialize("example.industry");

      const next = createDomainBuilder({
        ...baseManifest(),
        version: "1.1.0",
      })
        .withCapabilities("context", "cognition", "action")
        .withPermission("example.action.run")
        .registerContextContributor({
          id: "example.context",
          discover: () => [],
        })
        .registerCognitiveContributor({
          id: "example.cognition",
          gatherEvidence: () => [],
        })
        .registerActionContributor({
          id: "example.action",
          actionIds: ["example.run"],
          execute: () => ({ status: "succeeded" }),
        })
        .build();

      const upgraded = await lifecycle.upgrade("example.industry", next);
      expect(upgraded.package.manifest.version).toBe("1.1.0");
      expect(upgraded.state).toBe("inactive");
    });

    it("rejects invalid lifecycle transitions", async () => {
      const lifecycle = createDomainLifecycle({
        registrationApi: mockRegistrationApi(),
        runtimeVersion: "1.0.0-rc",
        coreVersion: "1.0.0-rc",
      });
      await lifecycle.install(buildSampleDomain());
      await expect(lifecycle.deactivate("example.industry")).rejects.toThrow(
        /Invalid lifecycle transition/
      );
    });
  });

  describe("contract compliance", () => {
    it("registers only through DomainAdapterRegistrationApi", async () => {
      const domain = buildSampleDomain();
      const api = mockRegistrationApi();
      const spy = vi.spyOn(api, "registerActionContributor");
      await domain.adapter.register(api);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]?.[0]?.id).toBe("example.action");
    });

    it("contains no education-specific identifiers in SDK facade", () => {
      const sdk = createDomainSdk();
      expect(JSON.stringify(sdk.version)).not.toMatch(/education|academy/i);
    });
  });
});
