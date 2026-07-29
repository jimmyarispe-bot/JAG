import { describe, expect, it, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TEACHER_EXPERIENCE_ENGINES,
  TEACHER_EXPERIENCE_GUARDS,
  TEACHER_EXPERIENCE_NAV,
  TEACHER_QUICK_ACTIONS,
  createTeacherExperienceOrchestrator,
  listTeacherExperienceEvents,
  listTeacherExperienceEvidence,
  listTeacherExperienceMemory,
  listTeacherExperienceTwin,
  publishTeacherExperienceEvent,
  resetTeacherExperienceOpsForTests,
} from "@/lib/teacher/experience";

const root = process.cwd();

describe("Wave 1.4 Teacher Workspace", () => {
  beforeEach(() => {
    resetTeacherExperienceOpsForTests();
  });

  it("is product orchestration with platform guards", () => {
    expect(TEACHER_EXPERIENCE_GUARDS.productExperienceOnly).toBe(true);
    expect(TEACHER_EXPERIENCE_GUARDS.createsPlatformEngines).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.duplicatesBusinessLogic).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.duplicatesLearningIntelligence).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.duplicatesKnowledge).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.duplicatesScheduling).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.duplicatesAttendance).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.duplicatesPayrollLogic).toBe(false);
    expect(TEACHER_EXPERIENCE_GUARDS.assistantEvidenceOnly).toBe(true);
    expect(TEACHER_EXPERIENCE_ENGINES).toContain("LearningIntelligenceEngine");
    expect(TEACHER_EXPERIENCE_ENGINES).toContain("FinanceEngine");
    expect(TEACHER_EXPERIENCE_ENGINES).toContain("Scheduling");
  });

  it("ships Wave 1.4 teacher routes and docs", () => {
    const required = [
      "src/app/dashboard/teacher/page.tsx",
      "src/app/dashboard/teacher/layout.tsx",
      "src/app/dashboard/teacher/classes/page.tsx",
      "src/app/dashboard/teacher/attendance/page.tsx",
      "src/app/dashboard/teacher/progress/page.tsx",
      "src/app/dashboard/teacher/lessons/page.tsx",
      "src/app/dashboard/teacher/assistant/page.tsx",
      "src/app/dashboard/teacher/communications/page.tsx",
      "src/app/dashboard/teacher/documents/page.tsx",
      "src/app/dashboard/teacher/timesheets/page.tsx",
      "src/app/dashboard/teacher/resources/page.tsx",
      "src/app/dashboard/teacher/profile/page.tsx",
      "src/lib/teacher/experience/orchestrator.ts",
      "src/lib/teacher/experience/assistant.ts",
      "src/lib/teacher/experience/timesheets.ts",
      "docs/academyos/portal/03_TEACHER_EXPERIENCE.md",
    ];
    for (const rel of required) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(TEACHER_EXPERIENCE_NAV.some((n) => n.href === "/dashboard/teacher/assistant")).toBe(
      true
    );
    expect(TEACHER_QUICK_ACTIONS.length).toBeGreaterThan(3);
    const catalog = readFileSync(
      join(root, "docs/platform/consolidation/02_FRONTEND_SCREEN_CATALOG.md"),
      "utf8"
    );
    expect(catalog).toContain("/dashboard/teacher/assistant");
    expect(catalog).toContain("AI Teaching Assistant");
  });

  it("publishes Twin, Evidence, and Memory for meaningful actions", () => {
    const org = "org-teacher-wave14";
    publishTeacherExperienceEvent({
      type: "teacher.dashboard_viewed",
      organizationId: org,
      recordType: "employee",
      recordId: "emp-1",
      projectLive: false,
    });
    publishTeacherExperienceEvent({
      type: "teacher.assistant_consulted",
      organizationId: org,
      recordType: "employee",
      recordId: "emp-1",
      projectLive: false,
    });
    expect(listTeacherExperienceEvents(org).length).toBe(2);
    expect(listTeacherExperienceTwin(org).length).toBe(2);
    expect(listTeacherExperienceEvidence(org).length).toBe(2);
    expect(listTeacherExperienceMemory(org).length).toBe(2);
  });

  it("assistant module is evidence-guarded (no fabricated recommendations)", () => {
    const assistantSrc = readFileSync(
      join(root, "src/lib/teacher/experience/assistant.ts"),
      "utf8"
    );
    expect(assistantSrc).toContain("Never fabricates");
    expect(assistantSrc).toContain("LearningIntelligenceEngine");
    expect(assistantSrc).toContain("evidenceNotes");
    expect(assistantSrc).toContain("source: \"LearningIntelligenceEngine\"");
  });

  it("orchestrator exposes workspace methods without inventing engines", () => {
    const orch = createTeacherExperienceOrchestrator();
    expect(orch.guards.createsPlatformEngines).toBe(false);
    expect(typeof orch.publishDashboardViewed).toBe("function");
    expect(typeof orch.takeAttendance).toBe("function");
    expect(typeof orch.completeSession).toBe("function");
    expect(typeof orch.searchDocuments).toBe("function");
  });

  it("regression: session and student detail routes remain", () => {
    expect(existsSync(join(root, "src/app/dashboard/teacher/sessions/[id]/page.tsx"))).toBe(
      true
    );
    expect(existsSync(join(root, "src/app/dashboard/teacher/students/[id]/page.tsx"))).toBe(
      true
    );
  });
});
