import { describe, expect, it } from "vitest";
import {
  clampConfidence,
  confidenceLevelFromScore,
  createEducationEvidenceBuilder,
  createEducationRecommendationBuilder,
  createEducationTrace,
  defineEducationCognitiveContributor,
  formatEducationExplanation,
  normalizePriority,
  runEducationIntelligencePipeline,
  scoreReadinessConfidence,
} from "@/lib/domains/education";

describe("Education Intelligence Framework", () => {
  it("runs observe → validate → evidence → recommend lifecycle", () => {
    const result = runEducationIntelligencePipeline(
      {
        contributorId: "education.cognition.framework.test",
        evidenceSource: "education.test",
        topicId: "education.test",
        attributeKey: "education.test",
        subjectId: (o: { id: string }) => o.id,
        validate: (o) => {
          if (!o.id) throw new Error("id required");
        },
        collectEvidence: (builder) => {
          builder.addBlockingIssue("blocked", "Blocked for test");
          builder.addWarning("warn", "Warn for test");
        },
        recommend: (builder) => {
          builder
            .recommend("act", "Act")
            .because("Because evidence")
            .confidence(0.9)
            .priority("critical")
            .supportedBy("blocked")
            .proposeAction({
              kind: "DoThing",
              actionId: "education.test.do",
              rationale: "Propose only",
            });
        },
      },
      { id: "subj-1" }
    );

    expect(result.readiness).toBe("blocked");
    expect(result.blockingIssues).toContain("Blocked for test");
    expect(result.warnings).toContain("Warn for test");
    expect(result.recommendations).toHaveLength(1);
    expect(result.suggestedActions[0]?.actionId).toBe("education.test.do");
    expect(result.recommendations[0]?.constitutionalTrace.domainPackageId).toBe(
      "education"
    );
  });

  it("builds evidence via shared builder helpers", () => {
    const built = createEducationEvidenceBuilder({
      source: "education.test",
      scopeId: "s1",
    })
      .addFinding("f1", "finding")
      .addWarning("w1", "warning")
      .addBlockingIssue("b1", "blocking")
      .addSupportingEvidence("s1", "support")
      .build();

    expect(built.items).toHaveLength(4);
    expect(built.blockingIssues).toEqual(["blocking"]);
    expect(built.warnings).toEqual(["warning"]);
    expect(built.refs[0]?.source).toBe("education.test");
  });

  it("builds recommendations with fluent API and shared trace", () => {
    const evidence = createEducationEvidenceBuilder({
      source: "education.test",
      scopeId: "s1",
    })
      .addBlockingIssue("gap", "Gap")
      .build().items;

    const builder = createEducationRecommendationBuilder(
      "education.cognition.framework.test"
    );
    builder
      .recommend("hold", "Hold")
      .because("Reason text")
      .confidence("medium")
      .priority("high")
      .supportedBy("gap")
      .proposeAction({
        kind: "Notify",
        actionId: "education.test.notify",
        rationale: "Notify",
      });

    const [rec] = builder.build(evidence);
    expect(rec?.explanation).toBe("Reason text");
    expect(rec?.constitutionalTrace).toEqual(
      createEducationTrace({
        contributorId: "education.cognition.framework.test",
        rationale: "Reason text",
      })
    );
    expect(rec?.attributes?.formattedExplanation).toContain("Reason:");
  });

  it("normalizes confidence and priority", () => {
    expect(clampConfidence(1.5)).toBe(1);
    expect(confidenceLevelFromScore(0.9)).toBe("high");
    expect(scoreReadinessConfidence({ blockingCount: 0, warningCount: 0 }).readiness).toBe(
      "ready"
    );
    expect(normalizePriority("critical").rank).toBe(1);
  });

  it("formats explanations consistently", () => {
    const formatted = formatEducationExplanation({
      reason: "Why",
      evidenceIds: ["e1"],
      confidence: 0.9,
      priority: "high",
      suggestedAction: "education.test.do",
    });
    expect(formatted.summary).toContain("Reason: Why");
    expect(formatted.summary).toContain("Suggested Action:");
  });

  it("defineEducationCognitiveContributor produces Runtime contributor", () => {
    const contributor = defineEducationCognitiveContributor({
      contributorId: "education.cognition.framework.test2",
      evidenceSource: "education.test",
      topicId: "education.test",
      attributeKey: "education.test",
      subjectId: (o: { id: string }) => o.id,
      validate: () => undefined,
      collectEvidence: (b) => b.addSupportingEvidence("ok", "ok"),
      recommend: (b) => {
        b.recommend("ok", "OK")
          .because("ok")
          .confidence(0.9)
          .priority(3)
          .supportedBy("ok")
          .proposeAction({
            kind: "X",
            actionId: "education.test.x",
            rationale: "x",
          });
      },
    });
    expect(contributor.id).toBe("education.cognition.framework.test2");
    expect(typeof contributor.gatherEvidence).toBe("function");
  });
});
