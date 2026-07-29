import { describe, expect, it, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  STUDENT_EXPERIENCE_ENGINES,
  STUDENT_EXPERIENCE_GUARDS,
  STUDENT_EXPERIENCE_NAV,
  STUDENT_QUICK_ACTIONS,
  createStudentExperienceOrchestrator,
  listStudentExperienceEvents,
  listStudentExperienceEvidence,
  listStudentExperienceMemory,
  listStudentExperienceTwin,
  publishStudentExperienceEvent,
  resetStudentExperienceOpsForTests,
} from "@/lib/portal/student-experience";

const root = process.cwd();

describe("Wave 1.3 Student Experience", () => {
  beforeEach(() => {
    resetStudentExperienceOpsForTests();
  });

  it("is product orchestration with platform guards", () => {
    expect(STUDENT_EXPERIENCE_GUARDS.productExperienceOnly).toBe(true);
    expect(STUDENT_EXPERIENCE_GUARDS.createsPlatformEngines).toBe(false);
    expect(STUDENT_EXPERIENCE_GUARDS.duplicatesLearningModels).toBe(false);
    expect(STUDENT_EXPERIENCE_GUARDS.duplicatesAssessments).toBe(false);
    expect(STUDENT_EXPERIENCE_GUARDS.noHallucinatedCoachAdvice).toBe(true);
    expect(STUDENT_EXPERIENCE_ENGINES).toContain("LearningIntelligenceEngine");
    expect(STUDENT_EXPERIENCE_ENGINES).toContain("KnowledgeEngine");
  });

  it("ships Wave 1.3 student routes and docs", () => {
    const required = [
      "src/app/portal/student/page.tsx",
      "src/app/portal/student/learning/page.tsx",
      "src/app/portal/student/assignments/page.tsx",
      "src/app/portal/student/assessments/page.tsx",
      "src/app/portal/student/attendance/page.tsx",
      "src/app/portal/student/calendar/page.tsx",
      "src/app/portal/student/documents/page.tsx",
      "src/app/portal/student/achievements/page.tsx",
      "src/app/portal/student/coach/page.tsx",
      "src/app/portal/student/profile/page.tsx",
      "src/lib/portal/student-experience/orchestrator.ts",
      "src/lib/portal/student-experience/coach.ts",
      "docs/academyos/portal/02_STUDENT_EXPERIENCE.md",
    ];
    for (const rel of required) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(STUDENT_EXPERIENCE_NAV.some((n) => n.href === "/portal/student/coach")).toBe(
      true
    );
    expect(STUDENT_QUICK_ACTIONS.length).toBeGreaterThan(3);
    const catalog = readFileSync(
      join(root, "docs/platform/consolidation/02_FRONTEND_SCREEN_CATALOG.md"),
      "utf8"
    );
    expect(catalog).toContain("/portal/student/learning");
    expect(catalog).toContain("Learning Coach");
  });

  it("publishes Twin, Evidence, and Memory for meaningful actions", () => {
    const org = "org-student-wave13";
    publishStudentExperienceEvent({
      type: "student.dashboard_viewed",
      organizationId: org,
      recordType: "student",
      recordId: "stu-1",
      projectLive: false,
    });
    publishStudentExperienceEvent({
      type: "student.coach_consulted",
      organizationId: org,
      recordType: "student",
      recordId: "stu-1",
      projectLive: false,
    });
    expect(listStudentExperienceEvents(org).length).toBe(2);
    expect(listStudentExperienceTwin(org).length).toBe(2);
    expect(listStudentExperienceEvidence(org).length).toBe(2);
    expect(listStudentExperienceMemory(org).length).toBe(2);
  });

  it("coach module is evidence-guarded (no hallucinated advice flag)", () => {
    const coachSrc = readFileSync(
      join(root, "src/lib/portal/student-experience/coach.ts"),
      "utf8"
    );
    expect(coachSrc).toContain("Never invents");
    expect(coachSrc).toContain("LearningIntelligenceEngine");
    expect(coachSrc).toContain("evidenceNotes");
  });

  it("orchestrator exposes journey methods without inventing engines", () => {
    const orch = createStudentExperienceOrchestrator();
    expect(orch.guards.createsPlatformEngines).toBe(false);
    expect(typeof orch.publishDashboardViewed).toBe("function");
    expect(typeof orch.publishLearningViewed).toBe("function");
    expect(typeof orch.sendMessage).toBe("function");
    expect(typeof orch.searchDocuments).toBe("function");
  });
});
