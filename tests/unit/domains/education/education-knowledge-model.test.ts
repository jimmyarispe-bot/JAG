import { describe, expect, it } from "vitest";
import {
  EDUCATION_CAPABILITY_CATALOG,
  EDUCATION_CLASSIFICATION_CATALOG,
  EDUCATION_ENTITY_CATALOG,
  EDUCATION_ENTITY_IDS,
  EDUCATION_KNOWLEDGE_MODEL,
  EDUCATION_POLICY_CATALOG,
  EDUCATION_POLICY_IDS,
  EDUCATION_RELATIONSHIP_CATALOG,
  EDUCATION_VOCABULARY,
  createEducationKnowledgeModel,
  getEducationKnowledgeModel,
  validateDefaultEducationKnowledgeModel,
  validateEducationKnowledgeModel,
} from "@/lib/domains/education";

describe("Education Knowledge Model (D3.0)", () => {
  describe("entity integrity", () => {
    it("registers required canonical entities with unique ids", () => {
      const ids = EDUCATION_ENTITY_CATALOG.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(
        expect.arrayContaining([
          EDUCATION_ENTITY_IDS.student,
          EDUCATION_ENTITY_IDS.family,
          EDUCATION_ENTITY_IDS.teacher,
          EDUCATION_ENTITY_IDS.campus,
          EDUCATION_ENTITY_IDS.program,
          EDUCATION_ENTITY_IDS.course,
          EDUCATION_ENTITY_IDS.class,
          EDUCATION_ENTITY_IDS.session,
          EDUCATION_ENTITY_IDS.assessment,
          EDUCATION_ENTITY_IDS.intervention,
          EDUCATION_ENTITY_IDS.scholarship,
          EDUCATION_ENTITY_IDS.attendanceRecord,
          EDUCATION_ENTITY_IDS.progressRecord,
          EDUCATION_ENTITY_IDS.goal,
        ])
      );
    });

    it("links every entity to a vocabulary term", () => {
      const vocabIds = new Set(EDUCATION_VOCABULARY.map((v) => v.id));
      for (const entity of EDUCATION_ENTITY_CATALOG) {
        expect(vocabIds.has(entity.vocabularyId)).toBe(true);
      }
    });
  });

  describe("relationship validation", () => {
    it("resolves all relationship endpoints to known entities", () => {
      const entityIds = new Set(EDUCATION_ENTITY_CATALOG.map((e) => e.id));
      for (const rel of EDUCATION_RELATIONSHIP_CATALOG) {
        expect(entityIds.has(rel.fromEntityId)).toBe(true);
        expect(entityIds.has(rel.toEntityId)).toBe(true);
      }
    });

    it("includes canonical example relationships", () => {
      const names = EDUCATION_RELATIONSHIP_CATALOG.map((r) => r.name);
      expect(names).toEqual(
        expect.arrayContaining([
          "Student enrolled in Program",
          "Teacher teaches Class",
          "Family supports Student",
          "Assessment measures Goal",
          "Intervention targets Student",
          "Scholarship funds Enrollment",
        ])
      );
    });

    it("fails validation when a relationship points at an unknown entity", () => {
      const broken = createEducationKnowledgeModel({
        relationships: [
          {
            id: "education.rel.broken",
            name: "Broken",
            description: "test",
            fromEntityId: EDUCATION_ENTITY_IDS.student,
            toEntityId: "education.entity.does_not_exist",
            predicate: "broken",
          },
        ],
      });
      const result = validateEducationKnowledgeModel(broken);
      expect(result.ok).toBe(false);
      expect(
        result.errors.some((e) => e.code === "RELATIONSHIP_TO_UNKNOWN")
      ).toBe(true);
    });
  });

  describe("policy registration", () => {
    it("registers attendance, enrollment, scholarship, and graduation policies", () => {
      const ids = EDUCATION_POLICY_CATALOG.map((p) => p.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          EDUCATION_POLICY_IDS.attendanceMinimumRate,
          EDUCATION_POLICY_IDS.enrollmentDocumentsRequired,
          EDUCATION_POLICY_IDS.scholarshipEligibility,
          EDUCATION_POLICY_IDS.graduationCredits,
        ])
      );
      for (const policy of EDUCATION_POLICY_CATALOG) {
        expect(policy.parameters.length).toBeGreaterThan(0);
      }
    });

    it("treats policies as metadata (no evaluate field)", () => {
      for (const policy of EDUCATION_POLICY_CATALOG) {
        expect(
          Object.prototype.hasOwnProperty.call(policy, "evaluate")
        ).toBe(false);
      }
    });
  });

  describe("vocabulary uniqueness", () => {
    it("has unique ids and preferred terms", () => {
      const ids = EDUCATION_VOCABULARY.map((v) => v.id);
      const terms = EDUCATION_VOCABULARY.map((v) => v.term.toLowerCase());
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(terms).size).toBe(terms.length);
    });
  });

  describe("classification consistency", () => {
    it("has unique scheme ids and unique codes per scheme", () => {
      const schemeIds = EDUCATION_CLASSIFICATION_CATALOG.map((c) => c.id);
      expect(new Set(schemeIds).size).toBe(schemeIds.length);

      for (const scheme of EDUCATION_CLASSIFICATION_CATALOG) {
        const codes = scheme.values.map((v) => v.code.toLowerCase());
        const valueIds = scheme.values.map((v) => v.id);
        expect(new Set(codes).size).toBe(codes.length);
        expect(new Set(valueIds).size).toBe(valueIds.length);
        expect(scheme.values.length).toBeGreaterThan(0);
      }
    });

    it("covers required classification schemes", () => {
      const ids = EDUCATION_CLASSIFICATION_CATALOG.map((c) => c.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          "education.class.program_type",
          "education.class.attendance_state",
          "education.class.enrollment_state",
          "education.class.assessment_type",
          "education.class.intervention_type",
          "education.class.communication_type",
        ])
      );
    });
  });

  describe("model + validator", () => {
    it("exposes a valid default knowledge model", () => {
      const model = getEducationKnowledgeModel();
      expect(model).toBe(EDUCATION_KNOWLEDGE_MODEL);
      expect(model.domainId).toBe("education");
      expect(model.capabilities).toBe(EDUCATION_CAPABILITY_CATALOG);

      const validation = validateDefaultEducationKnowledgeModel();
      expect(validation.ok).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("detects duplicate entity ids", () => {
      const duplicate = createEducationKnowledgeModel({
        entities: [
          ...EDUCATION_ENTITY_CATALOG,
          {
            ...EDUCATION_ENTITY_CATALOG[0]!,
            name: "Duplicate Student",
          },
        ],
      });
      const result = validateEducationKnowledgeModel(duplicate);
      expect(result.ok).toBe(false);
      expect(
        result.errors.some((e) => e.code === "ENTITY_DUPLICATE_ID")
      ).toBe(true);
    });
  });
});
