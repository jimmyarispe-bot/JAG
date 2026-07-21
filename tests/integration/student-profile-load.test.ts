import { describe, expect, it, vi } from "vitest";
import "@/lib/platform/profile";
import {
  assertClientProfileNavigationSerializable,
  buildProfileNavigation,
  toClientProfileNavigation,
} from "@/lib/platform/profile/navigation";
import { OverviewSection } from "@/components/students/profile/sections/StudentSectionViews";
import { emptyStudentExecutiveSummary } from "@/lib/ssis/queries";
import type { StudentProfileEnvelope } from "@/lib/students/profile/types";
import type { StudentRecord } from "@/lib/students/queries";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const STUDENT_ID = "33333333-3333-4333-8333-333333333333";

function minimalStudent(): StudentRecord {
  return {
    id: STUDENT_ID,
    school_id: "22222222-2222-4222-8222-222222222222",
    family_id: null,
    first_name: "Launch",
    last_name: "Student",
    preferred_name: null,
    date_of_birth: null,
    grade_level: "3rd_grade",
    gender: null,
    program: "academy_fl_campus",
    enrollment_status: "enrolled",
    status: "active",
    student_number: null,
    state_student_ids: [],
    photo_url: null,
    enrollment_start_date: null,
    enrollment_exit_date: null,
    graduation_year: null,
    admissions_lead_id: null,
    admissions_application_id: null,
    lifecycle_stage: "active",
    funding_sources: [],
    schools: { name: "Test School" },
    campuses: null,
    families: null,
  };
}

function minimalEnvelope(): StudentProfileEnvelope {
  return {
    profileKind: "student",
    entityType: "student",
    entityId: STUDENT_ID,
    organizationId: "11111111-1111-4111-8111-111111111111",
    schoolId: "22222222-2222-4222-8222-222222222222",
    campusId: null,
    displayName: "Launch Student",
    subtitle: "Student Profile",
    permissions: ["students.view", "students.edit"],
    enabledModules: [
      "platform",
      "ssis",
      "admissions",
      "finance",
      "scholarships",
      "scheduling",
      "compliance",
      "transportation",
      "decision_intelligence",
      "paj",
      "instruction",
    ],
    basePath: "/dashboard/students",
    sectionParam: "section",
    defaultSection: "overview",
    studentId: STUDENT_ID,
    familyId: null,
    gradeLevel: "3rd_grade",
    program: "academy_fl_campus",
    enrollmentStatus: "enrolled",
    lifecycleStage: "active",
    photoUrl: null,
    preferredName: null,
  };
}

describe("Student profile load after atomic create (minimal student)", () => {
  it("client navigation strips loadData and is JSON-serializable", () => {
    const envelope = minimalEnvelope();
    const navigation = buildProfileNavigation(envelope, undefined);

    // Server model still has loaders (used by section data loading).
    expect(typeof navigation.pinned[0]?.loadData).toBe("function");

    const clientNav = toClientProfileNavigation(navigation);
    expect(clientNav.activeSection).toBe("overview");
    expect(clientNav.pinned.some((s) => s.key === "overview")).toBe(true);

    // This is the crash that produced "This page couldn't load. A server error occurred."
    expect(() => assertClientProfileNavigationSerializable(clientNav)).not.toThrow();
    expect(JSON.stringify(clientNav)).not.toContain("loadData");

    for (const section of [
      ...clientNav.pinned,
      ...clientNav.groups.flatMap((g) => g.sections),
      ...clientNav.overflow,
    ]) {
      expect(section).not.toHaveProperty("loadData");
      expect(section.href).toContain(STUDENT_ID);
    }
  });

  it("overview renders empty states for a student with no family, docs, or enrollments", () => {
    const student = minimalStudent();
    const summary = emptyStudentExecutiveSummary("active");
    const markup = renderToStaticMarkup(
      createElement(OverviewSection, {
        envelope: minimalEnvelope(),
        sectionKey: "overview",
        data: {
          student,
          summary,
          enrollments: [],
          conversion: null,
        },
      })
    );

    expect(markup).toContain("Launch Student");
    expect(markup).toContain("No enrollments");
    expect(markup).toContain("3rd Grade");
    expect(markup).not.toContain("View admissions history");
  });

  it("empty executive summary never throws when optional SSIS data is missing", () => {
    const summary = emptyStudentExecutiveSummary();
    expect(summary.successScore).toBeNull();
    expect(summary.documentCount).toBe(0);
    expect(summary.fundingRecordCount).toBe(0);
    expect(summary.lifecycleStage).toBe("active");
    expect(summary.parentDisengaged).toBe(false);
  });
});
