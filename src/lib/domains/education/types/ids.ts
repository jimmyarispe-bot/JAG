/** Stable Education domain identifiers — contracts only. */

export const EDUCATION_DOMAIN_ID = "education" as const;

export const EDUCATION_DOMAIN_NAME = "education" as const;

export const EDUCATION_DOMAIN_VERSION = "0.1.0" as const;

export const EDUCATION_CONTRIBUTOR_IDS = {
  context: "education.context",
  intent: "education.intent",
  cognition: "education.cognition",
  /** First real cognitive intelligence contributor (D2.1). */
  enrollmentCognition: "education.cognition.enrollment",
  /** Second real cognitive intelligence contributor (D2.3). */
  attendanceCognition: "education.cognition.attendance",
  /** Third real cognitive intelligence contributor (D4.0). */
  progressCognition: "education.cognition.progress",
  /** First synthesis cognitive contributor (D4.1). */
  studentSuccessCognition: "education.cognition.student_success",
  /** Student Support capability — Intervention Intelligence (D4.2). */
  interventionCognition: "education.cognition.intervention",
  /** Student Support capability — Family Engagement Intelligence (D4.2). */
  familyEngagementCognition: "education.cognition.family_engagement",
  /** Student Support capability — Support Planning synthesis (D4.2). */
  supportPlanningCognition: "education.cognition.support_planning",
  /** Academic Operations — Scheduling Intelligence (D5.1). */
  schedulingCognition: "education.cognition.scheduling",
  /** Academic Operations — Staffing Intelligence (D5.1). */
  staffingCognition: "education.cognition.staffing",
  /** Academic Operations — Capacity Intelligence (D5.1). */
  capacityCognition: "education.cognition.capacity",
  /** Academic Operations — Operational Readiness synthesis (D5.1). */
  operationalReadinessCognition: "education.cognition.operational_readiness",
  /** Funding & Compliance — Scholarship Intelligence (D5.2). */
  scholarshipCognition: "education.cognition.scholarship",
  /** Funding & Compliance — Compliance Intelligence (D5.2). */
  complianceCognition: "education.cognition.compliance",
  /** Funding & Compliance — Funding Readiness synthesis (D5.2). */
  fundingReadinessCognition: "education.cognition.funding_readiness",
  /** Executive Intelligence — School Health (D5.3). */
  schoolHealthCognition: "education.cognition.school_health",
  /** Executive Intelligence — Campus Performance (D5.3). */
  campusPerformanceCognition: "education.cognition.campus_performance",
  /** Executive Intelligence — Executive Education Briefing top-level synthesis (D5.3). */
  executiveBriefingCognition: "education.cognition.executive_briefing",
  experience: "education.experience",
  action: "education.action",
  evidence: "education.evidence",
  memory: "education.memory",
  twin: "education.twin",
} as const;

export const EDUCATION_PERMISSIONS = {
  enrollmentApprove: "education.enrollment.approve",
  sessionSchedule: "education.session.schedule",
  attendanceRecord: "education.attendance.record",
  progressPublish: "education.progress.publish",
} as const;

export const EDUCATION_ACTION_IDS = {
  approveEnrollment: "education.enrollment.approve",
  scheduleSession: "education.session.schedule",
  recordAttendance: "education.attendance.record",
  publishProgress: "education.progress.publish",
} as const;

export const EDUCATION_INTENT_IDS = {
  teach: "education.teach",
  learn: "education.learn",
  assess: "education.assess",
  enroll: "education.enroll",
  support: "education.support",
  communicate: "education.communicate",
  plan: "education.plan",
  review: "education.review",
} as const;
