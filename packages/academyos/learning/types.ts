/** Learning Intelligence™ — curriculum, mastery, assessments, interventions. */

export const CURRICULUM_STATUSES = ["Draft", "Published", "Archived"] as const;
export type CurriculumStatus = (typeof CURRICULUM_STATUSES)[number];

export const MASTERY_LEVELS = [
  "Not Introduced",
  "Emerging",
  "Developing",
  "Proficient",
  "Mastered",
] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const ASSESSMENT_KINDS = [
  "Diagnostic",
  "Benchmark",
  "Formative",
  "Summative",
  "Observation",
  "Rubric",
] as const;
export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export const INTERVENTION_KINDS = [
  "Reading",
  "Math",
  "Structured Literacy",
  "Behavioral",
  "Executive Function",
  "Therapy",
] as const;
export type InterventionKind = (typeof INTERVENTION_KINDS)[number];

export const INTERVENTION_STATUSES = [
  "Planned",
  "Active",
  "Review Due",
  "Completed",
  "Discontinued",
] as const;
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

export const ACADEMY_PROGRESSION_DOMAINS = [
  "Reading",
  "Writing",
  "Math",
  "Structured Literacy",
] as const;
export type AcademyProgressionDomain =
  (typeof ACADEMY_PROGRESSION_DOMAINS)[number];

/** Configurable progression band (e.g. Reading Levels 1–3). */
export type ProgressionScale = {
  readonly domain: AcademyProgressionDomain;
  readonly levels: readonly number[];
  readonly steps?: readonly number[]; // Structured Literacy steps 1–10
  readonly label: string;
};

export type MasteryScaleConfig = {
  readonly levels: readonly MasteryLevel[];
  readonly progressions: readonly ProgressionScale[];
};

export type LearningObjective = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly competencyId: string | null;
};

export type Competency = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
};

export type CurriculumLesson = {
  readonly id: string;
  readonly title: string;
  readonly objectiveIds: readonly string[];
  readonly sequence: number;
};

export type CurriculumUnit = {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly CurriculumLesson[];
  readonly sequence: number;
};

export type CurriculumCourse = {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly units: readonly CurriculumUnit[];
};

export type Curriculum = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly version: string;
  readonly status: CurriculumStatus;
  readonly program: string | null;
  readonly campusId: string | null;
  readonly gradeLevels: readonly string[];
  readonly subject: string;
  readonly courses: readonly CurriculumCourse[];
  readonly competencies: readonly Competency[];
  readonly objectives: readonly LearningObjective[];
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type AssessmentRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly teacherId: string | null;
  readonly kind: AssessmentKind;
  readonly assessedOn: string;
  readonly objectiveId: string | null;
  readonly curriculumId: string | null;
  readonly result: MasteryLevel | string;
  readonly notes: string;
  readonly evidenceUrls: readonly string[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type MasteryRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly objectiveId: string;
  readonly curriculumId: string | null;
  readonly level: MasteryLevel;
  readonly domain: AcademyProgressionDomain | null;
  readonly progressionLevel: number | null;
  readonly progressionStep: number | null;
  readonly previousLevel: MasteryLevel | null;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly twinEntityId: string | null;
};

export type MasteryHistoryEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly objectiveId: string;
  readonly fromLevel: MasteryLevel | null;
  readonly toLevel: MasteryLevel;
  readonly progressionLevel: number | null;
  readonly progressionStep: number | null;
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly assessmentId: string | null;
};

export type Intervention = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly kind: InterventionKind;
  readonly status: InterventionStatus;
  readonly goals: string;
  readonly assignedStaffIds: readonly string[];
  readonly startsOn: string;
  readonly endsOn: string | null;
  readonly reviewOn: string | null;
  readonly outcome: string;
  readonly progressNotes: string;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
};

export type TeacherObservation = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly teacherId: string | null;
  readonly body: string;
  readonly assessedOn: string;
  readonly artifactUrls: readonly string[];
  readonly twinEntityId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type ProgressSnapshot = {
  readonly id: string;
  readonly organizationId: string;
  readonly studentId: string;
  readonly asOf: string;
  readonly masteredCount: number;
  readonly totalObjectives: number;
  readonly masteryPercent: number;
  readonly domainLevels: Readonly<
    Record<string, { level: number | null; step: number | null }>
  >;
  readonly twinEntityId: string | null;
  readonly createdAt: string;
};

export type LearningProgressSummary = {
  readonly organizationId: string;
  readonly studentsMasteringObjectives: number;
  readonly studentsNeedingIntervention: number;
  readonly growthTrendPercent: number;
  readonly assessmentCompletionRate: number;
  readonly literacyProgressionAverage: number;
  readonly graduationReadinessAverage: number;
  readonly programOutcomes: Readonly<Record<string, number>>;
  readonly masteryDistribution: Readonly<Record<MasteryLevel, number>>;
};

export type StudentLearningProfile = {
  readonly studentId: string;
  readonly organizationId: string;
  readonly reading: { level: number | null; mastery: MasteryLevel | null };
  readonly writing: { level: number | null; mastery: MasteryLevel | null };
  readonly math: { level: number | null; mastery: MasteryLevel | null };
  readonly structuredLiteracy: {
    level: number | null;
    step: number | null;
    mastery: MasteryLevel | null;
  };
  readonly currentMastery: readonly MasteryRecord[];
  readonly assessments: readonly AssessmentRecord[];
  readonly observations: readonly TeacherObservation[];
  readonly interventions: readonly Intervention[];
  readonly history: readonly MasteryHistoryEntry[];
  readonly growth: {
    readonly snapshots: readonly ProgressSnapshot[];
    readonly netLevelChanges: number;
  };
  readonly attendanceCorrelation: {
    readonly presentRate: number;
    readonly note: string;
  };
  readonly supportPlanCount: number;
};
