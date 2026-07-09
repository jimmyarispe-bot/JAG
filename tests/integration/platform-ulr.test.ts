import { describe, expect, it } from "vitest";
import "@/lib/platform/ulr";
import {
  SL_LIBRARY_MANIFEST,
  SL_TOTAL_COMPETENCY_COUNT,
  ULR_PRODUCTION_DOMAIN_KEYS,
  getAllUlrAtomicSkills,
  getAllUlrDomains,
  getUlrCompetency,
  getUlrDomainHierarchy,
  getUlrRegistrySnapshot,
  isKnownUlrCompetencyKey,
  isKnownUlrSkillKey,
  isUlrRegistryRegistered,
  isValidUlrCompetencyKey,
  validateEvidenceAgainstUlr,
  validateUlrRegistry,
} from "@/lib/platform/ulr";

describe("ULR registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateUlrRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers reference catalog on side-effect import", () => {
    expect(isUlrRegistryRegistered()).toBe(true);
    expect(getAllUlrDomains()).toHaveLength(6);
  });

  it("registers all six production learning domains", () => {
    const keys = new Set(getAllUlrDomains().map((domain) => domain.domainKey));
    for (const domainKey of ULR_PRODUCTION_DOMAIN_KEYS) {
      expect(keys.has(domainKey)).toBe(true);
    }
  });
});

describe("Structured Literacy gold standard", () => {
  it("registers 16 competency libraries", () => {
    expect(SL_LIBRARY_MANIFEST).toHaveLength(16);
    expect(SL_TOTAL_COMPETENCY_COUNT).toBe(285);
  });

  it("registers all Document 98 PA competencies", () => {
    expect(isKnownUlrCompetencyKey("AW-SL-PA-001-v1.0.0")).toBe(true);
    expect(isKnownUlrCompetencyKey("AW-SL-PA-024-v1.0.0")).toBe(true);
    expect(isValidUlrCompetencyKey("AW-SL-PA-001-v1.0.0")).toBe(true);
  });

  it("registers phonemic awareness library with PA handoff prerequisite", () => {
    expect(isKnownUlrCompetencyKey("AW-SL-PM-001-v1.0.0")).toBe(true);
    const pmEntry = getUlrCompetency("AW-SL-PM-001-v1.0.0");
    expect(pmEntry?.prerequisiteCompetencyKeys).toContain("AW-SL-PA-024-v1.0.0");
  });

  it("registers transfer capstone linking to LitLab", () => {
    const capstone = getUlrCompetency("AW-SL-TRF-018-v1.0.0");
    expect(capstone?.title).toContain("Structured Literacy Transfer Capstone");
    expect(capstone?.crossDomainLinks.some((l) => l.targetKey === "domain.litlab")).toBe(true);
  });

  it("registers atomic skill placeholders across all libraries", () => {
    expect(getAllUlrAtomicSkills().length).toBeGreaterThanOrEqual(850);
    expect(isKnownUlrSkillKey("AW-SL-PA-001-AS-001-v1.0.0")).toBe(true);
    expect(isKnownUlrSkillKey("AW-SL-PM-001-AS-001-v1.0.0")).toBe(true);
  });

  it("builds Structured Literacy domain hierarchy with 13 strands", () => {
    const hierarchy = getUlrDomainHierarchy("domain.structured_literacy");
    expect(hierarchy?.kind).toBe("domain");
    expect(hierarchy?.children?.length).toBeGreaterThanOrEqual(13);

    const paCompetency = getUlrCompetency("AW-SL-PA-001-v1.0.0");
    expect(paCompetency?.title).toBe("Segment Spoken Sentences into Words");
    expect(paCompetency?.subStrandKey).toBe(
      "domain.structured_literacy.sub_strand.sentence_awareness"
    );
  });

  it("returns complete registry snapshot", () => {
    const snapshot = getUlrRegistrySnapshot();
    expect(snapshot.domains).toHaveLength(6);
    expect(snapshot.competencies).toHaveLength(285);
    expect(snapshot.atomicSkills.length).toBeGreaterThanOrEqual(850);
    expect(snapshot.relationships.length).toBeGreaterThan(5000);
  });
});

describe("ULR KEE integration", () => {
  it("validates known competency keys for evidence", () => {
    const result = validateEvidenceAgainstUlr({
      competencyKeys: ["AW-SL-PA-001-v1.0.0", "AW-SL-DEC-001-v1.0.0"],
      skillKeys: ["AW-SL-PM-001-AS-001-v1.0.0"],
    });
    expect(result.ok).toBe(true);
  });

  it("flags unknown competency keys", () => {
    const result = validateEvidenceAgainstUlr({
      competencyKeys: ["AW-SL-PA-999-v1.0.0"],
    });
    expect(result.ok).toBe(false);
    expect(result.unknownCompetencyKeys).toContain("AW-SL-PA-999-v1.0.0");
  });
});
