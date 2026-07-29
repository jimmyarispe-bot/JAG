import { describe, expect, it } from "vitest";
import {
  EDUCATION_CAPABILITY_PACK_IDS,
  EDUCATION_CAPABILITY_PACK_MANIFESTS,
  EDUCATION_CONTRIBUTOR_IDS,
  STUDENT_LIFECYCLE_CAPABILITY_PACK,
  STUDENT_SUPPORT_CAPABILITY_PACK,
  createEducationCapabilityPack,
  createEducationCapabilityRegistry,
  getCapabilityPack,
  listCapabilityPacks,
  listContributors,
  listPlannerIntents,
  validateEducationCapabilityPacks,
  validateEducationCapabilityRegistry,
  type EducationCapabilityPackMetadata,
} from "@/lib/domains/education";

describe("Education Capability Pack Registry (D5.0)", () => {
  describe("registry", () => {
    it("registers Student Lifecycle and Student Support packs", () => {
      const registry = createEducationCapabilityRegistry();
      const packs = registry.listCapabilityPacks();

      expect(packs).toHaveLength(2);
      expect(packs.map((p) => p.id)).toEqual([
        EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
        EDUCATION_CAPABILITY_PACK_IDS.studentSupport,
      ]);
      expect(
        registry.getCapabilityPack(
          EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle
        )?.name
      ).toBe("Student Lifecycle");
      expect(
        registry.getCapabilityPack(
          EDUCATION_CAPABILITY_PACK_IDS.studentSupport
        )?.name
      ).toBe("Student Support");
    });

    it("exposes discovery helpers on the default registry", () => {
      expect(listCapabilityPacks().length).toBeGreaterThanOrEqual(2);
      expect(
        getCapabilityPack(EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle)?.id
      ).toBe(EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle);
      expect(
        listContributors(EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle)
      ).toEqual(
        expect.arrayContaining([
          EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
          EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
        ])
      );
      expect(
        listPlannerIntents(EDUCATION_CAPABILITY_PACK_IDS.studentSupport)
      ).toEqual(
        expect.arrayContaining([
          "education.support",
          "education.mtss.review",
          "education.family.meeting",
        ])
      );
    });
  });

  describe("discovery", () => {
    it("lists contributors and planner intents per pack", () => {
      const registry = createEducationCapabilityRegistry();
      const lifecycle = registry.getCapabilityPack(
        EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle
      )!;
      const support = registry.getCapabilityPack(
        EDUCATION_CAPABILITY_PACK_IDS.studentSupport
      )!;

      expect(registry.listContributors(lifecycle)).toEqual([
        EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
        EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
        EDUCATION_CONTRIBUTOR_IDS.progressCognition,
        EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
      ]);
      expect(registry.listContributors(support)).toEqual([
        EDUCATION_CONTRIBUTOR_IDS.interventionCognition,
        EDUCATION_CONTRIBUTOR_IDS.familyEngagementCognition,
        EDUCATION_CONTRIBUTOR_IDS.supportPlanningCognition,
      ]);
      expect(registry.listPlannerIntents(lifecycle).length).toBeGreaterThan(0);
      expect(registry.listPlannerIntents(support)).toContain(
        "education.support.review"
      );
    });

    it("returns empty lists for unknown pack ids", () => {
      const registry = createEducationCapabilityRegistry();
      expect(registry.getCapabilityPack("education.capability_pack.missing")).toBeUndefined();
      expect(registry.listContributors("education.capability_pack.missing")).toEqual(
        []
      );
      expect(
        registry.listPlannerIntents("education.capability_pack.missing")
      ).toEqual([]);
    });
  });

  describe("validation", () => {
    it("accepts the default registered manifests", () => {
      const result = validateEducationCapabilityRegistry();
      expect(result.ok).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("rejects duplicate pack ids", () => {
      const result = validateEducationCapabilityPacks([
        STUDENT_LIFECYCLE_CAPABILITY_PACK,
        { ...STUDENT_LIFECYCLE_CAPABILITY_PACK },
      ]);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === "DUPLICATE_PACK_ID")).toBe(
        true
      );
    });

    it("rejects missing contributors", () => {
      const broken: EducationCapabilityPackMetadata = {
        ...STUDENT_LIFECYCLE_CAPABILITY_PACK,
        id: "education.capability_pack.broken_contributors",
        contributors: [],
      };
      const result = validateEducationCapabilityPacks([broken]);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_CONTRIBUTORS")).toBe(
        true
      );
    });

    it("rejects unknown contributor references", () => {
      const broken: EducationCapabilityPackMetadata = {
        ...STUDENT_LIFECYCLE_CAPABILITY_PACK,
        id: "education.capability_pack.unknown_contributor",
        contributors: ["education.cognition.does_not_exist"],
      };
      const result = validateEducationCapabilityPacks([broken]);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === "UNKNOWN_CONTRIBUTOR")).toBe(
        true
      );
    });

    it("rejects missing documentation", () => {
      const broken: EducationCapabilityPackMetadata = {
        ...STUDENT_SUPPORT_CAPABILITY_PACK,
        id: "education.capability_pack.no_docs",
        documentation: [],
        dependencies: [],
      };
      const result = validateEducationCapabilityPacks([broken]);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_DOCS")).toBe(true);
    });

    it("rejects missing dependencies", () => {
      const broken: EducationCapabilityPackMetadata = {
        ...STUDENT_SUPPORT_CAPABILITY_PACK,
        id: "education.capability_pack.orphan_support",
        dependencies: ["education.capability_pack.not_registered"],
      };
      const result = validateEducationCapabilityPacks([broken]);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_DEPENDENCY")).toBe(
        true
      );
    });

    it("rejects inconsistent versions", () => {
      const broken: EducationCapabilityPackMetadata = {
        ...STUDENT_LIFECYCLE_CAPABILITY_PACK,
        id: "education.capability_pack.bad_version",
        version: "not-a-version",
      };
      const result = validateEducationCapabilityPacks([broken]);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.code === "VERSION_INCONSISTENT")).toBe(
        true
      );
    });
  });

  describe("metadata integrity", () => {
    it("keeps pack object fields aligned with metadata", () => {
      const pack = createEducationCapabilityPack(STUDENT_LIFECYCLE_CAPABILITY_PACK);
      expect(pack.id).toBe(STUDENT_LIFECYCLE_CAPABILITY_PACK.id);
      expect(pack.name).toBe(STUDENT_LIFECYCLE_CAPABILITY_PACK.name);
      expect(pack.version).toBe(STUDENT_LIFECYCLE_CAPABILITY_PACK.version);
      expect(pack.maturity).toBe(STUDENT_LIFECYCLE_CAPABILITY_PACK.maturity);
      expect(pack.metadata).toEqual(STUDENT_LIFECYCLE_CAPABILITY_PACK);
    });

    it("declares Student Support dependency on Student Lifecycle", () => {
      expect(STUDENT_SUPPORT_CAPABILITY_PACK.dependencies).toEqual([
        EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
      ]);
    });

    it("exposes complete metadata on every default manifest", () => {
      for (const manifest of EDUCATION_CAPABILITY_PACK_MANIFESTS) {
        expect(manifest.id).toMatch(/^education\.capability_pack\./);
        expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
        expect(manifest.contributors.length).toBeGreaterThan(0);
        expect(manifest.plannerIntents.length).toBeGreaterThan(0);
        expect(manifest.documentation.length).toBeGreaterThan(0);
        expect(manifest.knowledgeExtensions.length).toBeGreaterThan(0);
        expect(["planned", "building", "feature-complete", "stable", "deprecated"]).toContain(
          manifest.maturity
        );
      }
    });

    it("does not overlap contributor ownership between packs", () => {
      const lifecycle = new Set(STUDENT_LIFECYCLE_CAPABILITY_PACK.contributors);
      for (const id of STUDENT_SUPPORT_CAPABILITY_PACK.contributors) {
        expect(lifecycle.has(id)).toBe(false);
      }
    });
  });
});
