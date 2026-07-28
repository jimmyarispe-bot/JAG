/**
 * AcademyOS → Digital Twin™ mappings.
 * Education entities extend—not replace—canonical Twin types.
 */

import type { TwinEntityType } from "@/lib/digital-twin";

export type AcademyOsTwinMapping = {
  readonly academyEntity: string;
  readonly twinEntityType: TwinEntityType;
  /** How the education concept is represented when not a first-class Twin type. */
  readonly representation: "entity" | "relationship" | "evidence" | "metadata";
  readonly notes: string;
};

export const ACADEMYOS_TWIN_MAPPINGS: readonly AcademyOsTwinMapping[] =
  Object.freeze([
    {
      academyEntity: "Student",
      twinEntityType: "Person",
      representation: "entity",
      notes: "metadata.academyosKind=student",
    },
    {
      academyEntity: "Parent/Guardian",
      twinEntityType: "Person",
      representation: "entity",
      notes: "metadata.academyosKind=guardian",
    },
    {
      academyEntity: "Teacher",
      twinEntityType: "Person",
      representation: "entity",
      notes: "metadata.academyosKind=teacher",
    },
    {
      academyEntity: "School",
      twinEntityType: "Organization",
      representation: "entity",
      notes: "Child org or department-like Organization node",
    },
    {
      academyEntity: "Classroom",
      twinEntityType: "Location",
      representation: "entity",
      notes: "Physical or virtual classroom location",
    },
    {
      academyEntity: "Course",
      twinEntityType: "Product / Service",
      representation: "entity",
      notes: "Course catalog as Product / Service",
    },
    {
      academyEntity: "Enrollment",
      twinEntityType: "Person",
      representation: "relationship",
      notes: "participates_in / assigned_to between Student and Course/Session",
    },
    {
      academyEntity: "Attendance",
      twinEntityType: "Event",
      representation: "entity",
      notes: "Attendance event per student/session",
    },
    {
      academyEntity: "Grade",
      twinEntityType: "Document",
      representation: "evidence",
      notes: "Grade artifacts project as Document/Evidence",
    },
    {
      academyEntity: "IEP",
      twinEntityType: "Document",
      representation: "entity",
      notes: "IEP as Document with compliance metadata",
    },
    {
      academyEntity: "Scholarship",
      twinEntityType: "Asset",
      representation: "entity",
      notes: "Financial resource modeled as Asset (kind=scholarship)",
    },
    {
      academyEntity: "Session",
      twinEntityType: "Event",
      representation: "entity",
      notes: "Class session / meeting event",
    },
    {
      academyEntity: "Campus",
      twinEntityType: "Organization",
      representation: "entity",
      notes: "SIS campus maps to Organization",
    },
    {
      academyEntity: "Medical Alert",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Medical alerts as Document metadata on student",
    },
    {
      academyEntity: "Support Service",
      twinEntityType: "Product / Service",
      representation: "entity",
      notes:
        "No Twin type 'Service' — mapped to Product / Service (PER-TWIN-SERVICE-TYPE deferred)",
    },
    {
      academyEntity: "504 / BSP",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Support plans project as Document",
    },
    {
      academyEntity: "Class",
      twinEntityType: "Product / Service",
      representation: "entity",
      notes:
        "Instructional class/section as Product / Service (PER-TWIN-CLASS-TYPE deferred)",
    },
    {
      academyEntity: "Lesson Notes",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Teacher classroom / lesson notes as Document",
    },
    {
      academyEntity: "Tuition Plan",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Tuition plan as Document (PER-TWIN-FINANCE-TYPES deferred)",
    },
    {
      academyEntity: "Invoice",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Finance invoice as Document",
    },
    {
      academyEntity: "Payment",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Payment / refund / credit as Document",
    },
    {
      academyEntity: "Scholarship Award",
      twinEntityType: "Document",
      representation: "entity",
      notes:
        "Finance award Document; domain Scholarship remains Asset when created via scholarships service",
    },
    {
      academyEntity: "Family Account",
      twinEntityType: "Organization",
      representation: "entity",
      notes:
        "No Twin Account type — Family Financial Account → Organization (PER-TWIN-ACCOUNT-TYPE)",
    },
    {
      academyEntity: "Curriculum",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Curriculum framework as Document",
    },
    {
      academyEntity: "Assessment",
      twinEntityType: "Document",
      representation: "entity",
      notes:
        "Assessment as Document (PER-TWIN-EVIDENCE-TYPE remains open for Evidence)",
    },
    {
      academyEntity: "Learning Objective",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Learning objectives as Document",
    },
    {
      academyEntity: "Teacher Observation",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Teacher observations as Document",
    },
    {
      academyEntity: "Intervention",
      twinEntityType: "Document",
      representation: "entity",
      notes:
        "Intervention as Document + student timeline (PER-TWIN-WORK-TYPE remains open)",
    },
    {
      academyEntity: "Progress Snapshot",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Deterministic progress snapshot as Document",
    },
    {
      academyEntity: "Employee",
      twinEntityType: "Person",
      representation: "entity",
      notes: "Workforce employee as Person",
    },
    {
      academyEntity: "Position",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Job position as Document",
    },
    {
      academyEntity: "Contract",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Employment contract as Document",
    },
    {
      academyEntity: "Certification",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Staff certification / compliance artifact as Document",
    },
    {
      academyEntity: "Timesheet",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Timesheet as Document",
    },
    {
      academyEntity: "Payroll Summary",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Payroll preparation export as Document",
    },
    {
      academyEntity: "Performance Review",
      twinEntityType: "Document",
      representation: "entity",
      notes:
        "Performance review as Document; optional Organizational Memory link via metadata",
    },
    {
      academyEntity: "Notification",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Communication notification as Document",
    },
    {
      academyEntity: "Message",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Secure message / thread as Document",
    },
    {
      academyEntity: "Announcement",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Org/campus announcement as Document",
    },
    {
      academyEntity: "Workflow",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Deterministic operational workflow as Document",
    },
    {
      academyEntity: "Template",
      twinEntityType: "Document",
      representation: "entity",
      notes: "Communication template as Document",
    },
  ]);

export function twinExternalKey(
  academyEntity: string,
  id: string
): string {
  return `academyos:${academyEntity.toLowerCase().replace(/\W+/g, "_")}:${id}`;
}
