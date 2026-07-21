import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatformCore,
  registerEducationPlatformConnectors,
  registerEnterprisePlatformConnectors,
  createCanvasPlatformConnector,
  createDemoEducationClient,
  reconnectEducationConnector,
  educationCanonicalType,
  EDUCATION_OBJECT_TYPES,
  EDUCATION_KG_KINDS,
  buildEducationEccWidgets,
  buildEducationExecutiveFeed,
  computeEducationSignals,
  educationStore,
  enterpriseStore,
  registerAllConnectors,
  createIntegrationPlatform,
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
} from "@/lib/platform/integrations";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("RC-3.06 — Education Connectors", () => {
  beforeEach(() => {
    educationStore.clear();
    enterpriseStore.clear();
  });

  describe("catalog", () => {
    it("registers Canvas, PowerSchool, and Google Classroom as production connectors", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      for (const [id, meta] of [
        ["canvas", canvasMetadata],
        ["powerschool", powerschoolMetadata],
        ["google_classroom", googleClassroomMetadata],
      ] as const) {
        const connector = platform.getConnector(id);
        expect(connector).toBeTruthy();
        expect(connector!.metadata.placeholder).toBe(false);
        expect(connector!.metadata.version).toBe(meta.version);
      }
      expect(platform.getConnector("canvas")!.metadata.objectTypes).toContain("teacher");
      expect(platform.getConnector("canvas")!.metadata.objectTypes).toContain("course");
      expect(platform.getConnector("canvas")!.metadata.objectTypes).toContain("schedule");
    });
  });

  describe("auth lifecycle", () => {
    it("installs, refreshes, disconnects, and reconnects Canvas", async () => {
      const connector = createCanvasPlatformConnector({
        client: createDemoEducationClient("canvas"),
      });
      expect((await connector.authenticate("canvas-org-1")).ok).toBe(true);
      expect((await connector.refreshAuthentication("canvas-org-1")).ok).toBe(true);
      await connector.disconnect("canvas-org-1");
      expect((await connector.validate("canvas-org-1")).ok).toBe(false);
      expect((await reconnectEducationConnector(connector, "canvas-org-1")).ok).toBe(true);
    });
  });

  describe("canonical mapping", () => {
    it("maps Student / Teacher / Course / Assignment / Grade / Attendance / Schedule", () => {
      expect(educationCanonicalType("student")).toBe("education.student");
      expect(educationCanonicalType("teacher")).toBe("education.teacher");
      expect(educationCanonicalType("course")).toBe("education.course");
      expect(educationCanonicalType("class")).toBe("education.course");
      expect(educationCanonicalType("assignment")).toBe("education.assignment");
      expect(educationCanonicalType("grade")).toBe("education.grade");
      expect(educationCanonicalType("attendance")).toBe("education.attendance");
      expect(educationCanonicalType("schedule")).toBe("education.schedule");
      expect(EDUCATION_OBJECT_TYPES).toEqual(
        expect.arrayContaining([
          "student",
          "teacher",
          "course",
          "assignment",
          "grade",
          "attendance",
          "schedule",
        ])
      );
      expect(EDUCATION_KG_KINDS).toEqual(
        expect.arrayContaining(["Student", "Person", "Organization", "Task", "Meeting"])
      );
    });
  });

  describe("sync & intelligence", () => {
    it("syncs LMS providers and computes RC-3.06 signals", async () => {
      const platform = createIntegrationPlatformCore();
      registerEducationPlatformConnectors(platform);
      platform.lifecycle.seed("canvas-org-education-demo", "connected");
      platform.lifecycle.seed("powerschool-org-education-demo", "connected");

      expect((await platform.syncNow("canvas", "canvas-org-education-demo", "full")).status).toBe(
        "succeeded"
      );
      expect(
        (await platform.syncNow("powerschool", "powerschool-org-education-demo", "full")).status
      ).toBe("succeeded");

      const records = educationStore.allRecords("org-education-demo");
      expect(records.some((r) => r.objectType === "teacher")).toBe(true);
      expect(records.some((r) => r.objectType === "course")).toBe(true);
      expect(records.some((r) => r.objectType === "schedule")).toBe(true);

      const signals = computeEducationSignals(records, "org-education-demo");
      expect(signals.activeStudents).toBeGreaterThan(0);
      expect(signals.attendanceRate).toBeGreaterThan(0);
      expect(signals.academicPerformance).toBeGreaterThan(0);
      expect(signals.studentHealth).toBeGreaterThan(0);
      expect(signals.teacherWorkload).toBeGreaterThan(0);
    });

    it("soft-reads scholarship awards for scholarship analytics", async () => {
      const platform = createIntegrationPlatformCore();
      registerEducationPlatformConnectors(platform);
      registerEnterprisePlatformConnectors(platform);
      platform.lifecycle.seed("canvas-org-enterprise-demo", "connected");
      platform.lifecycle.seed("scholarship-org-enterprise-demo", "connected");
      await platform.syncNow("canvas", "canvas-org-enterprise-demo", "full");
      await platform.syncNow("scholarship", "scholarship-org-enterprise-demo", "full");

      const signals = computeEducationSignals(
        educationStore.allRecords("org-enterprise-demo"),
        "org-enterprise-demo"
      );
      expect(signals.scholarshipAwardCount).toBeGreaterThan(0);
      expect(signals.scholarshipAwardTotal).toBeGreaterThan(0);
    });
  });

  describe("ECC widgets", () => {
    it("builds enrollment, health, workload, performance, attendance, scholarship widgets", async () => {
      const platform = createIntegrationPlatformCore();
      registerEducationPlatformConnectors(platform);
      platform.lifecycle.seed("google_classroom-org-education-demo", "connected");
      await platform.syncNow("google_classroom", "google_classroom-org-education-demo", "full");

      const widgets = buildEducationEccWidgets("exec-demo-org");
      expect(widgets).toBeTruthy();
      expect(widgets!.studentEnrollment.kind).toBe("student_enrollment");
      expect(widgets!.studentHealth.kind).toBe("student_health");
      expect(widgets!.teacherWorkload.kind).toBe("teacher_workload");
      expect(widgets!.academicPerformance.kind).toBe("academic_performance");
      expect(widgets!.attendance.kind).toBe("education_attendance");
      expect(widgets!.scholarshipAnalytics.kind).toBe("scholarship_analytics");
      expect(widgets!.academicPerformance.academicPerformance).toBeGreaterThan(0);
    });
  });

  describe("executive feed", () => {
    it("feeds education soft lights without vendor-specific branching", async () => {
      const platform = createIntegrationPlatformCore();
      registerEducationPlatformConnectors(platform);
      platform.lifecycle.seed("canvas-org-education-demo", "connected");
      await platform.syncNow("canvas", "canvas-org-education-demo", "full");

      const feed = buildEducationExecutiveFeed("org-education-demo");
      expect(feed).toBeTruthy();
      expect(feed!.education.studentHealth).toBeGreaterThan(0);
      expect(feed!.briefBullets.every((b) => !b.toLowerCase().includes("canvas api"))).toBe(true);
    });
  });

  describe("OIOS registration", () => {
    it("registers education connectors on Integration Platform Core via OIOS", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("canvas")).toBe(true);
      expect(oios.integrations?.registry.has("powerschool")).toBe(true);
      expect(oios.integrations?.registry.has("google_classroom")).toBe(true);
      expect(oios.integrations?.registry.getVersion("canvas")).toBe("1.1.0");
    });
  });
});
