import { describe, expect, it } from "vitest";
import {
  DOMAIN_SDK_MINIMUM_CORE,
  DOMAIN_SDK_RUNTIME_CONTRACT,
  DOMAIN_SDK_VERSION,
  validateDomain,
} from "@/lib/jag/domain-sdk";
import {
  EDUCATION_ACTION_CATALOG,
  EDUCATION_ACTION_IDS,
  EDUCATION_CONTRIBUTOR_IDS,
  EDUCATION_CONTEXT_FAMILIES,
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_VERSION,
  EDUCATION_INTENT_CATALOG,
  EDUCATION_INTENT_IDS,
  EDUCATION_MANIFEST,
  buildEducationDomain,
  createEducationContributors,
  createEducationDomainRegistry,
  listEducationContributorIds,
  registerEducationDomain,
} from "@/lib/domains/education";
import { createJagRuntime } from "@/lib/jag/runtime";

describe("Education Domain Foundation (D1)", () => {
  describe("manifest", () => {
    it("declares Education identity and versions", () => {
      expect(EDUCATION_MANIFEST.id).toBe(EDUCATION_DOMAIN_ID);
      expect(EDUCATION_MANIFEST.displayName).toBe("Education");
      expect(EDUCATION_MANIFEST.version).toBe(EDUCATION_DOMAIN_VERSION);
      expect(EDUCATION_MANIFEST.requiredRuntimeVersion).toBe(
        DOMAIN_SDK_RUNTIME_CONTRACT
      );
      expect(EDUCATION_MANIFEST.requiredSdkVersion).toBe(DOMAIN_SDK_VERSION);
      expect(EDUCATION_MANIFEST.minimumCoreVersion).toBe(
        DOMAIN_SDK_MINIMUM_CORE
      );
    });

    it("declares supported capabilities without claiming to be JAG", () => {
      expect(EDUCATION_MANIFEST.supportedCapabilities).toEqual(
        expect.arrayContaining([
          "context",
          "intent",
          "cognition",
          "experience",
          "action",
          "evidence",
          "memory",
          "twin",
        ])
      );
      expect(EDUCATION_MANIFEST.displayName.toLowerCase()).not.toBe("jag");
      expect(EDUCATION_MANIFEST.metadata?.attributes?.academyos).toBe(false);
    });

    it("lists all contributor declarations", () => {
      const ids = EDUCATION_MANIFEST.contributors.map((c) => c.id);
      expect(ids).toEqual(expect.arrayContaining(listEducationContributorIds()));
    });
  });

  describe("contracts", () => {
    it("defines Education context families", () => {
      expect(EDUCATION_CONTEXT_FAMILIES).toEqual(
        expect.arrayContaining([
          "school",
          "campus",
          "academic_term",
          "program",
          "class",
          "session",
          "student",
          "family",
          "teacher",
        ])
      );
    });

    it("defines normalized Education intents", () => {
      expect(Object.values(EDUCATION_INTENT_IDS)).toEqual(
        expect.arrayContaining([
          "education.teach",
          "education.learn",
          "education.assess",
          "education.enroll",
        ])
      );
      expect(EDUCATION_INTENT_CATALOG.length).toBeGreaterThanOrEqual(8);
    });

    it("defines Education action catalog contracts", () => {
      expect(EDUCATION_ACTION_CATALOG.map((a) => a.actionId)).toEqual(
        expect.arrayContaining([
          EDUCATION_ACTION_IDS.approveEnrollment,
          EDUCATION_ACTION_IDS.scheduleSession,
          EDUCATION_ACTION_IDS.recordAttendance,
          EDUCATION_ACTION_IDS.publishProgress,
        ])
      );
    });
  });

  describe("contributor discovery", () => {
    it("creates placeholder contributors with stable ids", () => {
      const set = createEducationContributors();
      expect(set.context.id).toBe(EDUCATION_CONTRIBUTOR_IDS.context);
      expect(set.intent.id).toBe(EDUCATION_CONTRIBUTOR_IDS.intent);
      expect(set.cognition.id).toBe(EDUCATION_CONTRIBUTOR_IDS.cognition);
      expect(set.experience.id).toBe(EDUCATION_CONTRIBUTOR_IDS.experience);
      expect(set.action.id).toBe(EDUCATION_CONTRIBUTOR_IDS.action);
      expect(set.evidence.id).toBe(EDUCATION_CONTRIBUTOR_IDS.evidence);
      expect(set.memory.id).toBe(EDUCATION_CONTRIBUTOR_IDS.memory);
      expect(set.twin.id).toBe(EDUCATION_CONTRIBUTOR_IDS.twin);
    });

    it("context discover and intent detect return empty placeholders", () => {
      const set = createEducationContributors();
      expect(set.context.discover({} as never)).toEqual([]);
      expect(set.intent.detect({} as never, [])).toEqual([]);
      expect(set.cognition.gatherEvidence?.({} as never)).toEqual([]);
    });

    it("action execute is skipped (no business logic)", async () => {
      const set = createEducationContributors();
      const result = await set.action.execute({} as never);
      expect(result.status).toBe("skipped");
      expect(result.error?.code).toBe("EDUCATION_FOUNDATION_NO_EXECUTION");
    });
  });

  describe("validation", () => {
    it("validates built Education domain against SDK rules", () => {
      const domain = buildEducationDomain();
      const result = validateDomain(domain.manifest, {
        bundle: domain.bundle,
        host: {
          runtimeVersion: DOMAIN_SDK_RUNTIME_CONTRACT,
          coreVersion: DOMAIN_SDK_MINIMUM_CORE,
          sdkVersion: DOMAIN_SDK_VERSION,
        },
      });
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("SDK compatibility", () => {
    it("registers into Domain SDK registry", () => {
      const domain = buildEducationDomain();
      const registry = createEducationDomainRegistry();
      const entry = registry.register(domain);
      expect(entry.status).toBe("registered");
      expect(registry.enable(EDUCATION_DOMAIN_ID).status).toBe("enabled");
      const validation = registry.validate(EDUCATION_DOMAIN_ID);
      expect(validation).toMatchObject({ ok: true });
    });
  });

  describe("lifecycle and runtime registration", () => {
    it("activates Education on a Jag Runtime without Core changes", async () => {
      const runtime = createJagRuntime();
      const { domain, lifecycle, validation } = await registerEducationDomain({
        registrationApi: runtime.registry.asDomainAdapterApi(),
      });

      expect(validation.ok).toBe(true);
      expect(domain.manifest.id).toBe(EDUCATION_DOMAIN_ID);
      expect(lifecycle.get(EDUCATION_DOMAIN_ID)?.state).toBe("active");

      expect(
        runtime.registry
          .listContextContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.context)
      ).toBe(true);
      expect(
        runtime.registry
          .listIntentContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.intent)
      ).toBe(true);
      expect(
        runtime.registry
          .listCognitiveContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.cognition)
      ).toBe(true);
      expect(
        runtime.registry
          .listCognitiveContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition)
      ).toBe(true);
      expect(
        runtime.registry
          .listCognitiveContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.attendanceCognition)
      ).toBe(true);
      expect(
        runtime.registry
          .listExperienceContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.experience)
      ).toBe(true);
      expect(
        runtime.registry
          .listActionContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.action)
      ).toBe(true);
      expect(
        runtime.registry
          .listEvidenceContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.evidence)
      ).toBe(true);
      expect(
        runtime.registry
          .listMemoryContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.memory)
      ).toBe(true);
      expect(
        runtime.registry
          .listTwinContributors()
          .some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.twin)
      ).toBe(true);
    });
  });
});
