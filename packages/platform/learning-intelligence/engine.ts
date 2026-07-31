/**
 * LearningIntelligenceEngine — shared facade over AcademyOS mastery/learning SoR.
 *
 * DOES NOT recreate mastery scales, assessment kinds, or intervention models.
 * DOES integrate packages/academyos/learning as the education adapter.
 */

import { academyOsLearningAdapter } from "./academyos-adapter";
import {
  LEARNING_INTELLIGENCE_SINKS,
  listLearningIntelEvents,
  listLearningIntelEvidence,
  listLearningIntelMemory,
  listLearningIntelTwin,
  publishLearningIntelEvent,
  resetLearningIntelOpsStoreForTests,
} from "./events";
import { linkAssessmentEvidenceToKnowledge } from "./knowledge-bridge";
import { LEARNING_INTELLIGENCE_GUARDS } from "./types";

export class LearningIntelligenceEngine {
  readonly guards = LEARNING_INTELLIGENCE_GUARDS;
  readonly sinks = LEARNING_INTELLIGENCE_SINKS;
  /** Canonical education adapter — SoR is AcademyOS learning pack. */
  readonly adapter = academyOsLearningAdapter;

  private mastery = academyOsLearningAdapter.createMasteryService();
  private assessments = academyOsLearningAdapter.createAssessmentService();
  private curriculum = academyOsLearningAdapter.createCurriculumService();
  private interventions = academyOsLearningAdapter.createInterventionService();
  private progress = academyOsLearningAdapter.createProgressService();
  private gradebook = academyOsLearningAdapter.createGradebookService();
  private profiles = academyOsLearningAdapter.createLearningProfileService();
  private reporting = academyOsLearningAdapter.createLearningReportingService();
  private parentPortal =
    academyOsLearningAdapter.createLearningParentPortalService();

  // --- Mastery (delegates) ---
  getMasteryScale = this.mastery.getScale;
  configureMasteryScale = this.mastery.configureScale;
  updateMastery = (
    input: Parameters<typeof this.mastery.update>[0]
  ): ReturnType<typeof this.mastery.update> => {
    const result = this.mastery.update(input);
    if (!("error" in result)) {
      publishLearningIntelEvent({
        type: "learning.mastery_updated",
        organizationId: input.organizationId,
        recordType: "mastery_record",
        recordId: result.id,
        actorUserId: input.actor,
        payload: {
          studentId: input.studentId,
          level: input.level,
          objectiveId: input.objectiveId,
          adapter: this.adapter.id,
        },
      });
    }
    return result;
  };
  listMastery = this.mastery.list;
  masteryHistory = this.mastery.history;
  masteryDistribution = this.mastery.distribution;

  // --- Assessments (delegates + optional Knowledge link) ---
  recordAssessment = (
    input: Parameters<typeof this.assessments.record>[0] & {
      linkEvidenceToKnowledge?: boolean;
    }
  ): ReturnType<typeof this.assessments.record> => {
    const result = this.assessments.record(input);
    if ("error" in result) return result;

    publishLearningIntelEvent({
      type: "learning.assessment_recorded",
      organizationId: input.organizationId,
      recordType: "assessment",
      recordId: result.id,
      actorUserId: input.createdBy,
      payload: {
        studentId: input.studentId,
        kind: input.kind,
        result: String(input.result),
        adapter: this.adapter.id,
      },
    });

    if (
      input.linkEvidenceToKnowledge &&
      input.evidenceUrls &&
      input.evidenceUrls.length > 0
    ) {
      const factIds = linkAssessmentEvidenceToKnowledge({
        organizationId: input.organizationId,
        userId: input.createdBy,
        studentId: input.studentId,
        assessmentId: result.id,
        evidenceUrls: input.evidenceUrls,
        result: String(input.result),
      });
      publishLearningIntelEvent({
        type: "learning.evidence_linked",
        organizationId: input.organizationId,
        recordType: "assessment",
        recordId: result.id,
        actorUserId: input.createdBy,
        payload: { factIds, documentLinked: true },
      });
    }

    return result;
  };
  listAssessments = this.assessments.list;
  searchAssessments = this.assessments.search;

  // --- Curriculum ---
  createCurriculum = this.curriculum.create;
  searchCurricula = this.curriculum.search;
  listCurricula = this.curriculum.list;
  getCurriculum = this.curriculum.get;
  publishCurriculum = (
    input: Parameters<typeof this.curriculum.publish>[0]
  ): ReturnType<typeof this.curriculum.publish> => {
    const result = this.curriculum.publish(input);
    if (result && !("error" in result)) {
      publishLearningIntelEvent({
        type: "learning.curriculum_published",
        organizationId: input.organizationId,
        recordType: "curriculum",
        recordId: result.id,
        actorUserId: input.actor,
        payload: { name: result.name, adapter: this.adapter.id },
      });
    }
    return result;
  };

  // --- Interventions ---
  createIntervention = (
    input: Parameters<typeof this.interventions.create>[0]
  ): ReturnType<typeof this.interventions.create> => {
    const result = this.interventions.create(input);
    if (!("error" in result)) {
      publishLearningIntelEvent({
        type: "learning.intervention_changed",
        organizationId: input.organizationId,
        recordType: "intervention",
        recordId: result.id,
        actorUserId: input.createdBy,
        payload: { kind: input.kind, status: result.status },
      });
    }
    return result;
  };
  patchIntervention = this.interventions.patch;
  listInterventions = this.interventions.list;
  getIntervention = this.interventions.get;

  // --- Progress / gradebook / profile / reports / portal ---
  progressSnapshot = (
    input: Parameters<typeof this.progress.snapshot>[0]
  ): ReturnType<typeof this.progress.snapshot> => {
    const result = this.progress.snapshot(input);
    if (!("error" in result)) {
      publishLearningIntelEvent({
        type: "learning.progress_snapshot",
        organizationId: input.organizationId,
        recordType: "progress_snapshot",
        recordId: result.id,
        actorUserId: input.actor,
        payload: { studentId: input.studentId },
      });
    }
    return result;
  };

  getGradebook = this.gradebook.get;
  getLearningProfile = this.profiles.get;
  buildOrgProgressSummary =
    academyOsLearningAdapter.buildLearningProgressSummary;
  generateReport = this.reporting.generate;
  resolveParentPortal = this.parentPortal.resolve;

  // --- Constants (from AcademyOS — not redefined) ---
  readonly masteryLevels = academyOsLearningAdapter.constants.MASTERY_LEVELS;
  readonly assessmentKinds = academyOsLearningAdapter.constants.ASSESSMENT_KINDS;
  readonly interventionKinds =
    academyOsLearningAdapter.constants.INTERVENTION_KINDS;
  readonly defaultMasteryScale =
    academyOsLearningAdapter.constants.DEFAULT_MASTERY_SCALE;

  // --- OIOS sinks ---
  listEvents = listLearningIntelEvents;
  listTwinProjections = listLearningIntelTwin;
  listEvidenceRecords = listLearningIntelEvidence;
  listMemoryRecords = listLearningIntelMemory;
}

export function createLearningIntelligenceEngine(): LearningIntelligenceEngine {
  return new LearningIntelligenceEngine();
}

export function resetLearningIntelligenceForTests(): void {
  academyOsLearningAdapter.resetLearningStoreForTests();
  resetLearningIntelOpsStoreForTests();
}
