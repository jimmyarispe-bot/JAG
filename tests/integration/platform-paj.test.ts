import { describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../helpers/mock-supabase";
import "@/lib/platform/ulr";
import "@/lib/platform/events";
import "@/lib/platform/rules";
import "@/lib/platform/decision";
import "@/lib/platform/intelligence-graph";
import { recordEvidence } from "@/lib/platform/evidence";
import { getUlrCompetency } from "@/lib/platform/ulr";
import {
  confirmCompetencyAdvance,
  createLearningJourney,
  evaluateEvidenceBundle,
  evaluateJourneyRecommendations,
  evaluatePrerequisitesMet,
  getCompetencyGuidance,
  getJourneySnapshot,
  PAJ_SL_ENTRY_COMPETENCY_KEY,
  processJourneyEvidence,
} from "@/lib/platform/paj";

const PA_COMPETENCY = PAJ_SL_ENTRY_COMPETENCY_KEY;
const PA_SKILL = "AW-SL-PA-001-AS-001-v1.0.0";
const PA_NEXT = "AW-SL-PA-002-v1.0.0";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  const hex = idCounter.toString(16).padStart(12, "0");
  return `${prefix.slice(0, 8)}-0000-4000-8000-${hex}`;
}

function createPajMockStore() {
  const journeys: Record<string, unknown>[] = [];
  const enrollments: Record<string, unknown>[] = [];
  const placements: Record<string, unknown>[] = [];
  const competencyProgress: Record<string, unknown>[] = [];
  const skillProgress: Record<string, unknown>[] = [];
  const evidenceRecords: Record<string, unknown>[] = [];
  const graphEdges: Record<string, unknown>[] = [];
  const eventRecords: Record<string, unknown>[] = [];
  const ruleEvaluations: Record<string, unknown>[] = [];

  const supabase = createMockSupabase(({ table, operation, payload, filters }) => {
    const upsertRow = (
      store: Record<string, unknown>[],
      row: Record<string, unknown>,
      conflictKeys: string[]
    ) => {
      const idx = store.findIndex((existing) =>
        conflictKeys.every((key) => existing[key] === row[key])
      );
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...row, updated_at: new Date().toISOString() };
        return store[idx];
      }
      const created = {
        id: nextId("aaaaaaaa"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...row,
      };
      store.push(created);
      return created;
    };

    if (table === "platform_paj_journeys") {
      if (operation === "insert" || operation === "single") {
        const row = {
          id: nextId("bbbbbbbb"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(payload as Record<string, unknown>),
        };
        journeys.push(row);
        return { data: row, error: null };
      }
      if (operation === "maybeSingle") {
        let rows = [...journeys];
        if (filters.id) rows = rows.filter((r) => r.id === filters.id);
        if (filters.student_id) rows = rows.filter((r) => r.student_id === filters.student_id);
        if (filters.status) rows = rows.filter((r) => r.status === filters.status);
        return { data: rows[0] ?? null, error: null };
      }
      return { data: journeys, error: null };
    }

    if (table === "platform_paj_domain_enrollments") {
      if (operation === "insert" || operation === "single") {
        const row = {
          id: nextId("cccccccc"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(payload as Record<string, unknown>),
        };
        enrollments.push(row);
        return { data: row, error: null };
      }
      if (operation === "update") {
        const idx = enrollments.findIndex((r) => r.id === filters.id);
        if (idx >= 0) {
          enrollments[idx] = {
            ...enrollments[idx],
            ...(payload as Record<string, unknown>),
          };
          return { data: enrollments[idx], error: null };
        }
      }
      if (operation === "select") {
        const rows = enrollments.filter((r) => r.journey_id === filters.journey_id);
        return { data: rows, error: null };
      }
      return { data: enrollments, error: null };
    }

    if (table === "platform_paj_placements") {
      if (operation === "insert" || operation === "single") {
        const row = {
          id: nextId("dddddddd"),
          created_at: new Date().toISOString(),
          ...(payload as Record<string, unknown>),
        };
        placements.push(row);
        return { data: row, error: null };
      }
      return { data: placements, error: null };
    }

    if (table === "platform_paj_competency_progress") {
      if (operation === "upsert" || operation === "single") {
        const row = payload as Record<string, unknown>;
        const data = upsertRow(competencyProgress, row, ["journey_id", "competency_key"]);
        return { data, error: null };
      }
      if (operation === "maybeSingle") {
        const row = competencyProgress.find(
          (r) =>
            r.journey_id === filters.journey_id && r.competency_key === filters.competency_key
        );
        return { data: row ?? null, error: null };
      }
      if (operation === "select") {
        const rows = competencyProgress.filter((r) => r.journey_id === filters.journey_id);
        return { data: rows, error: null };
      }
      return { data: competencyProgress, error: null };
    }

    if (table === "platform_paj_skill_progress") {
      if (operation === "upsert" || operation === "single") {
        const row = payload as Record<string, unknown>;
        const data = upsertRow(skillProgress, row, ["journey_id", "skill_key"]);
        return { data, error: null };
      }
      if (operation === "select") {
        const rows = skillProgress.filter((r) => r.journey_id === filters.journey_id);
        return { data: rows, error: null };
      }
      return { data: skillProgress, error: null };
    }

    if (table === "platform_evidence_records") {
      if (operation === "insert" || operation === "single") {
        const row = {
          id: nextId("eeeeeeee"),
          recorded_at: new Date().toISOString(),
          status: "active",
          ...(payload as Record<string, unknown>),
        };
        evidenceRecords.push(row);
        return { data: row, error: null };
      }
      if (operation === "maybeSingle") {
        const row = evidenceRecords.find((r) => r.id === filters.id);
        return { data: row ?? null, error: null };
      }
      if (operation === "select") {
        let rows = [...evidenceRecords];
        if (filters.student_id) {
          rows = rows.filter((r) => r.student_id === filters.student_id);
        }
        const competencyContains = filters["contains:competency_keys"] as string[] | undefined;
        if (competencyContains?.length) {
          rows = rows.filter((r) => {
            const keys = r.competency_keys as string[] | undefined;
            return keys?.some((key) => competencyContains.includes(key));
          });
        }
        return { data: rows, error: null };
      }
      return { data: evidenceRecords, error: null };
    }

    if (table === "platform_graph_edges") {
      if (operation === "upsert" || operation === "single") {
        const row = {
          id: nextId("ffffffff"),
          recorded_at: new Date().toISOString(),
          status: "active",
          ...(payload as Record<string, unknown>),
        };
        const idx = graphEdges.findIndex(
          (e) =>
            e.edge_type === row.edge_type &&
            e.source_node_id === row.source_node_id &&
            e.target_node_id === row.target_node_id &&
            e.provider_key === row.provider_key
        );
        if (idx >= 0) graphEdges[idx] = { ...graphEdges[idx], ...row };
        else graphEdges.push(row);
        return { data: row, error: null };
      }
      return { data: graphEdges, error: null };
    }

    if (table === "platform_event_records") {
      if (operation === "insert" || operation === "single") {
        const row = { id: nextId("10101010"), ...(payload as Record<string, unknown>) };
        eventRecords.push(row);
        return { data: row, error: null };
      }
      return { data: eventRecords, error: null };
    }

    if (table === "platform_rule_evaluation_records") {
      if (operation === "insert" || operation === "single") {
        const row = { id: nextId("20202020"), ...(payload as Record<string, unknown>) };
        ruleEvaluations.push(row);
        return { data: row, error: null };
      }
      return { data: ruleEvaluations, error: null };
    }

    if (table === "platform_decision_execution_records") {
      if (operation === "insert" || operation === "single") {
        return { data: { id: nextId("30303030") }, error: null };
      }
      return { data: [], error: null };
    }

    return { data: null, error: { message: `Unknown table ${table}` } };
  });

  return {
    supabase,
    journeys,
    enrollments,
    competencyProgress,
    skillProgress,
    evidenceRecords,
    graphEdges,
    eventRecords,
  };
}

describe("PAJ mastery engine", () => {
  it("evaluates PA-L3 evidence bundle requirements", () => {
    const bundle = evaluateEvidenceBundle(PA_COMPETENCY, [
      {
        evidence_type_key: "observation.instructional",
        evidence_confidence: 0.9,
        captured_by_role: "teacher",
      },
      {
        evidence_type_key: "observation.checklist",
        evidence_confidence: 0.85,
        captured_by_role: "teacher",
      },
    ]);
    expect(bundle.ok).toBe(true);
    expect(bundle.suggestedLevel).toBe(3);
    expect(bundle.minTypesMet).toBe(true);
    expect(bundle.confidenceMet).toBe(true);
  });

  it("evaluates ULR prerequisite chain", () => {
    const next = getUlrCompetency(PA_NEXT);
    expect(next).toBeDefined();
    const result = evaluatePrerequisitesMet(PA_NEXT, new Set([PA_COMPETENCY]));
    expect(result.ok).toBe(true);
  });
});

describe("PAJ Structured Literacy lifecycle", () => {
  it("creates journey with SL placement at PA-001", async () => {
    const { supabase, journeys, enrollments, graphEdges, eventRecords } = createPajMockStore();

    const result = await createLearningJourney(supabase as never, {
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      organizationId: TEST_UUIDS.organization,
      actorUserId: TEST_UUIDS.user,
    });

    expect(result.journeyId).toBeTruthy();
    expect(result.placedCompetencyKey).toBe(PA_COMPETENCY);
    expect(journeys).toHaveLength(1);
    expect(enrollments[0]?.active_competency_key).toBe(PA_COMPETENCY);
    expect(graphEdges.length).toBeGreaterThanOrEqual(3);
    expect(eventRecords.some((e) => e.event_type === "learning.journey.created")).toBe(true);
  });

  it("runs full lifecycle: evidence → L3 → advance to PA-002", async () => {
    idCounter = 0;
    const store = createPajMockStore();
    const { supabase } = store;

    const { journeyId } = await createLearningJourney(supabase as never, {
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      organizationId: TEST_UUIDS.organization,
    });

    const evidence1 = await recordEvidence(supabase as never, {
      evidenceTypeKey: "observation.instructional",
      competencyKeys: [PA_COMPETENCY],
      skillKeys: [PA_SKILL],
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      capturedByRole: "teacher",
      capturedByUserId: TEST_UUIDS.user,
      evidenceConfidence: 0.9,
      evidenceQuality: 0.85,
      narrative: "Student clapped word boundaries accurately.",
    });
    expect(evidence1.id).toBeTruthy();

    await processJourneyEvidence(supabase as never, {
      journeyId,
      evidenceId: evidence1.id!,
      studentId: TEST_UUIDS.student,
      competencyKeys: [PA_COMPETENCY],
      skillKeys: [PA_SKILL],
      evidenceTypeKey: "observation.instructional",
      evidenceConfidence: 0.9,
      capturedByRole: "teacher",
    });

    let snapshot = await getJourneySnapshot(supabase as never, journeyId);
    expect(snapshot?.competencyProgress[0]?.mastery_level).toBeLessThan(3);

    const evidence2 = await recordEvidence(supabase as never, {
      evidenceTypeKey: "observation.checklist",
      competencyKeys: [PA_COMPETENCY],
      skillKeys: [PA_SKILL],
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      capturedByRole: "teacher",
      capturedByUserId: TEST_UUIDS.user,
      evidenceConfidence: 0.88,
      evidenceQuality: 0.82,
      narrative: "Checklist: 4/4 word segmentation trials correct.",
    });

    const masteryResults = await processJourneyEvidence(supabase as never, {
      journeyId,
      evidenceId: evidence2.id!,
      studentId: TEST_UUIDS.student,
      competencyKeys: [PA_COMPETENCY],
      skillKeys: [PA_SKILL],
      evidenceTypeKey: "observation.checklist",
      evidenceConfidence: 0.88,
      capturedByRole: "teacher",
    });

    expect(masteryResults[0]?.masteryLevel).toBe(3);
    expect(masteryResults[0]?.bundleOk).toBe(true);

    snapshot = await getJourneySnapshot(supabase as never, journeyId);
    const pa001Progress = snapshot?.competencyProgress.find(
      (p) => p.competency_key === PA_COMPETENCY
    );
    expect(pa001Progress?.mastery_level).toBe(3);
    expect(pa001Progress?.evidence_count).toBe(2);

    const advance = await confirmCompetencyAdvance(supabase as never, {
      journeyId,
      competencyKey: PA_COMPETENCY,
      educatorUserId: TEST_UUIDS.user,
    });

    expect(advance.advanced).toBe(true);
    expect(advance.nextCompetencyKey).toBe(PA_NEXT);

    snapshot = await getJourneySnapshot(supabase as never, journeyId);
    expect(snapshot?.activeCompetencyKey).toBe(PA_NEXT);
    expect(
      snapshot?.competencyProgress.some(
        (p) => p.competency_key === PA_NEXT && p.status === "in_progress"
      )
    ).toBe(true);

    expect(
      store.eventRecords.some((e) => e.event_type === "learning.competency.advanced")
    ).toBe(true);
    expect(store.graphEdges.some((e) => e.edge_type === "student.demonstrates.competency")).toBe(
      true
    );
  });

  it("retrieves parent and teacher guidance from ULR", () => {
    const guidance = getCompetencyGuidance(PA_COMPETENCY);
    expect(guidance.competencyKey).toBe(PA_COMPETENCY);
    expect(guidance.instructionalStrategies.length).toBeGreaterThan(0);
  });

  it("evaluates journey recommendations via Rules Engine", async () => {
    idCounter = 0;
    const { supabase } = createPajMockStore();

    const { journeyId } = await createLearningJourney(supabase as never, {
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
    });

    const snapshot = await getJourneySnapshot(supabase as never, journeyId);
    const recommendations = await evaluateJourneyRecommendations({
      supabase: supabase as never,
      studentId: TEST_UUIDS.student,
      schoolId: TEST_UUIDS.school,
      activeCompetencyKey: PA_COMPETENCY,
      competencyProgress: snapshot!.competencyProgress,
    });

    expect(recommendations.ruleEvaluationId).toBeTruthy();
  });
});
