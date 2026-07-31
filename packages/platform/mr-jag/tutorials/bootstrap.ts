/**
 * Bootstrap catalog — declarative registrations products may extend/replace.
 * Not hardcoded FAQ answers; metadata only for learning paths per persona.
 */

import { registerMrJagContent } from "./registry";
import type {
  LearningPath,
  MrJagPersona,
  TutorialPageMetadata,
  WalkthroughDefinition,
} from "../types";

function page(
  partial: TutorialPageMetadata
): TutorialPageMetadata {
  return Object.freeze(partial);
}

function teacherPath(): {
  tutorials: TutorialPageMetadata[];
  path: LearningPath;
  walkthroughs: WalkthroughDefinition[];
} {
  const steps = [
    ["aos.welcome", "Welcome", "Meet AcademyOS and your teaching workspace."],
    ["aos.dashboard", "Dashboard", "Orient to today's priorities."],
    ["aos.attendance", "Attendance", "Record and review class attendance."],
    ["aos.lessons", "Lessons", "Plan and deliver classroom lessons."],
    ["aos.assessments", "Assessments", "Capture mastery and grades."],
    ["aos.communication", "Communication", "Message families and staff."],
    ["aos.timesheets", "Timesheets", "Submit time for payroll."],
  ] as const;

  const tutorials = steps.map(([pageId, title, overview], i) =>
    page({
      pageId,
      productId: "academyos",
      title,
      estimatedMinutes: 8 + i,
      prerequisites: i === 0 ? [] : [steps[i - 1]![0]],
      difficulty: i < 2 ? "Beginner" : "Intermediate",
      learningObjectives: Object.freeze([overview]),
      relatedPages: Object.freeze(
        steps.filter((_, j) => Math.abs(j - i) === 1).map((s) => s[0])
      ),
      relatedWorkflows: Object.freeze([title.toLowerCase()]),
      personas: Object.freeze(["Teacher"] as MrJagPersona[]),
      overview,
      bestPractices: Object.freeze([
        "Complete the interactive walkthrough before exploring advanced filters.",
      ]),
      videoLessonUrl: null,
      quizId: i === steps.length - 1 ? "quiz.teacher.onboarding" : null,
      certificationId:
        i === steps.length - 1 ? "cert.teacher.onboarding" : null,
    })
  );

  const path: LearningPath = {
    id: "path.teacher.onboarding",
    title: "Teacher Onboarding",
    persona: "Teacher",
    productId: "academyos",
    steps: Object.freeze(
      steps.map(([pageId, label], order) =>
        Object.freeze({ pageId, label, order })
      )
    ),
    certificationId: "cert.teacher.onboarding",
  };

  const walkthroughs: WalkthroughDefinition[] = [
    {
      id: "wt.teacher.attendance",
      title: "Record attendance",
      pageId: "aos.attendance",
      productId: "academyos",
      personas: Object.freeze(["Teacher"]),
      estimatedMinutes: 5,
      steps: Object.freeze([
        {
          id: "s1",
          order: 0,
          title: "Open Attendance",
          body: "Select today's class from the attendance board.",
          targetSelector: "[data-mrjag='attendance-board']",
          pageId: "aos.attendance",
        },
        {
          id: "s2",
          order: 1,
          title: "Mark status",
          body: "Mark each student Present, Absent, or Tardy.",
          targetSelector: "[data-mrjag='attendance-status']",
          pageId: "aos.attendance",
        },
        {
          id: "s3",
          order: 2,
          title: "Save",
          body: "Save the roster to notify families when configured.",
          targetSelector: "[data-mrjag='attendance-save']",
          pageId: "aos.attendance",
        },
      ]),
    },
  ];

  return { tutorials, path, walkthroughs };
}

function personaPath(
  persona: MrJagPersona,
  productId: string,
  titles: readonly string[]
): { tutorials: TutorialPageMetadata[]; path: LearningPath } {
  const slug = persona.toLowerCase().replace(/\s+/g, "-");
  const tutorials = titles.map((title, i) => {
    const pageId = `${productId}.${slug}.${i}`;
    return page({
      pageId,
      productId,
      title,
      estimatedMinutes: 6 + i,
      prerequisites: i === 0 ? [] : [`${productId}.${slug}.${i - 1}`],
      difficulty: "Beginner",
      learningObjectives: Object.freeze([
        `Complete ${title} for the ${persona} journey.`,
      ]),
      relatedPages: Object.freeze([]),
      relatedWorkflows: Object.freeze([title.toLowerCase()]),
      personas: Object.freeze([persona]),
      overview: `${title} overview for ${persona}.`,
      bestPractices: Object.freeze([
        "Use Mr. JAG help if a control is unclear.",
      ]),
      videoLessonUrl: null,
      quizId: null,
      certificationId:
        i === titles.length - 1 ? `cert.${slug}.onboarding` : null,
    });
  });
  const path: LearningPath = {
    id: `path.${slug}.onboarding`,
    title: `${persona} Onboarding`,
    persona,
    productId,
    steps: Object.freeze(
      tutorials.map((t, order) =>
        Object.freeze({ pageId: t.pageId, label: t.title, order })
      )
    ),
    certificationId: `cert.${slug}.onboarding`,
  };
  return { tutorials, path };
}

/** Register starter catalogs so every persona has a path; products can re-register. */
export function bootstrapMrJagCatalog(): {
  readonly tutorials: number;
  readonly paths: number;
  readonly walkthroughs: number;
} {
  const teacher = teacherPath();
  const bundles = [
    teacher,
    personaPath("Founder", "jag-platform", [
      "Welcome",
      "Mission Control",
      "Organizations",
      "Release Health",
      "Certified Founder",
    ]),
    personaPath("Executive", "jag-platform", [
      "Welcome",
      "Executive Insights",
      "Risk",
      "Certified Executive",
    ]),
    personaPath("School Leader", "academyos", [
      "Welcome",
      "Campus Overview",
      "Staffing",
      "Enrollment",
      "Certified School Leader",
    ]),
    personaPath("Admissions", "academyos", [
      "Welcome",
      "Applicants",
      "Documents",
      "Enrollment",
      "Certified Admissions",
    ]),
    personaPath("Finance", "academyos", [
      "Welcome",
      "Family Accounts",
      "Invoices",
      "Payments",
      "Certified Finance",
    ]),
    personaPath("HR", "academyos", [
      "Welcome",
      "Employees",
      "Payroll",
      "Certifications",
      "Certified HR",
    ]),
    personaPath("Parent", "academyos", [
      "Welcome",
      "Student Progress",
      "Billing",
      "Messages",
      "Certified Parent",
    ]),
    personaPath("Student", "academyos", [
      "Welcome",
      "Schedule",
      "Goals",
      "Support",
      "Certified Student",
    ]),
    personaPath("Support", "jag-platform", [
      "Welcome",
      "Triage Desk",
      "Diagnostics",
      "Knowledge Capture",
      "Certified Support",
    ]),
    personaPath("Developer", "jag-platform", [
      "Welcome",
      "API Orientation",
      "Extensions",
      "Evidence Gates",
      "Certified Developer",
    ]),
  ];

  const tutorials = bundles.flatMap((b) => b.tutorials);
  const paths = bundles.map((b) => b.path);
  const walkthroughs = teacher.walkthroughs;

  return registerMrJagContent({ tutorials, paths, walkthroughs });
}
