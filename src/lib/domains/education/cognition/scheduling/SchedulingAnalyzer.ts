import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_ENTITY_IDS,
  EDUCATION_POLICY_IDS,
} from "../../knowledge";
import type { SchedulingObservation } from "./SchedulingObservation";
import type { SchedulingEvidenceCode } from "./SchedulingTypes";

export interface ScheduleConflict {
  kind: "teacher_overlap" | "room_overlap";
  sessionIds: readonly string[];
  resourceId: string;
}

export interface SchedulingAnalysis {
  signals: SchedulingEvidenceCode[];
  conflicts: ScheduleConflict[];
  coverageGaps: string[];
  optimizationOpportunities: string[];
  knowledgeRefs: {
    capabilityId: string;
    entityIds: readonly string[];
    policyIds: readonly string[];
  };
}

export function analyzeScheduling(
  observation: SchedulingObservation
): SchedulingAnalysis {
  const sessions = observation.sessions ?? [];
  const signals: SchedulingEvidenceCode[] = ["schedule_bound"];

  if (sessions.length === 0 && (observation.sections?.length ?? 0) === 0) {
    return {
      signals: ["insufficient_schedule_data", "schedule_bound"],
      conflicts: [],
      coverageGaps: [],
      optimizationOpportunities: [],
      knowledgeRefs: knowledgeRefs(),
    };
  }

  const disallowTeacher = observation.constraints?.disallowTeacherOverlap !== false;
  const disallowRoom = observation.constraints?.disallowRoomOverlap !== false;
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i]!;
      const b = sessions[j]!;
      if (a.day !== b.day || !overlaps(a.startTime, a.endTime, b.startTime, b.endTime)) {
        continue;
      }
      if (disallowTeacher && a.teacherId && a.teacherId === b.teacherId) {
        conflicts.push({
          kind: "teacher_overlap",
          sessionIds: [a.sessionId, b.sessionId],
          resourceId: a.teacherId,
        });
      }
      if (disallowRoom && a.classroomId && a.classroomId === b.classroomId) {
        conflicts.push({
          kind: "room_overlap",
          sessionIds: [a.sessionId, b.sessionId],
          resourceId: a.classroomId,
        });
      }
    }
  }

  const coverageGaps = sessions
    .filter((s) => s.covered === false || !s.teacherId)
    .map((s) => s.sessionId);

  const optimizationOpportunities: string[] = [];
  if (conflicts.length === 0 && coverageGaps.length === 0) {
    const underusedRooms = findSparseRooms(sessions);
    for (const room of underusedRooms) {
      optimizationOpportunities.push(`Room ${room} has sparse utilization`);
    }
  }

  if (conflicts.length > 0) signals.push("schedule_conflict");
  if (coverageGaps.length > 0) signals.push("coverage_gap");
  if (optimizationOpportunities.length > 0) signals.push("optimization_opportunity");
  if (
    conflicts.length === 0 &&
    coverageGaps.length === 0 &&
    sessions.length > 0
  ) {
    signals.push("schedule_healthy");
  }

  return {
    signals: unique(signals),
    conflicts,
    coverageGaps,
    optimizationOpportunities,
    knowledgeRefs: knowledgeRefs(),
  };
}

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function findSparseRooms(sessions: SchedulingObservation["sessions"]): string[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.classroomId) continue;
    counts.set(s.classroomId, (counts.get(s.classroomId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n === 1 && sessions.length >= 4)
    .map(([id]) => id)
    .slice(0, 3);
}

function knowledgeRefs() {
  return {
    capabilityId: EDUCATION_CAPABILITY_IDS.scheduling,
    entityIds: [
      EDUCATION_ENTITY_IDS.section,
      EDUCATION_ENTITY_IDS.session,
      EDUCATION_ENTITY_IDS.classroom,
      EDUCATION_ENTITY_IDS.instructionalBlock,
      EDUCATION_ENTITY_IDS.bellSchedule,
    ],
    policyIds: [
      EDUCATION_POLICY_IDS.sessionOverlap,
      EDUCATION_POLICY_IDS.instructionalCoverage,
    ],
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
