import type { AdmissionsIntegrationDefinition } from "@/lib/admissions/registry/types";

/** Cross-module integration points for the Admissions OS. */
export const ADMISSIONS_INTEGRATIONS: AdmissionsIntegrationDefinition[] = [
  {
    key: "family_workspace",
    label: "Family Workspace",
    targetModule: "ssis",
    status: "live",
    description: "Open admissions leads surfaced on family profile overview and documents.",
  },
  {
    key: "student_workspace",
    label: "Student Workspace",
    targetModule: "sis",
    status: "live",
    description: "Admissions and enrollment sections on student profile after conversion.",
  },
  {
    key: "scholarships",
    label: "Scholarships",
    targetModule: "scholarships",
    status: "live",
    description: "Scholarship applications linked to admissions applications.",
  },
  {
    key: "billing",
    label: "Billing",
    targetModule: "finance",
    status: "partial",
    description: "Forecasted tuition and financial account creation on enrollment.",
  },
  {
    key: "communications",
    label: "Communications",
    targetModule: "admissions",
    status: "live",
    description: "Template engine, merge fields, and communication queue.",
  },
  {
    key: "calendar",
    label: "Calendar",
    targetModule: "scheduling",
    status: "partial",
    description: "Tour and interview calendar events via workflow actions.",
  },
  {
    key: "tasks",
    label: "Tasks",
    targetModule: "admissions",
    status: "live",
    description: "Stage-automated and staff-assigned admissions tasks.",
  },
  {
    key: "documents",
    label: "Documents",
    targetModule: "admissions",
    status: "live",
    description: "Application checklist, portal uploads, and document requests.",
  },
  {
    key: "platform_activity",
    label: "Platform Activity",
    targetModule: "platform",
    status: "partial",
    description: "Activity timeline events for admissions entities.",
  },
  {
    key: "platform_notes",
    label: "Platform Notes",
    targetModule: "platform",
    status: "live",
    description: "Staff notes on leads and applications.",
  },
  {
    key: "platform_tags",
    label: "Platform Tags",
    targetModule: "platform",
    status: "partial",
    description: "Entity tagging for admissions prospects.",
  },
  {
    key: "relationship_engine",
    label: "Relationship Engine",
    targetModule: "platform",
    status: "live",
    description: "Student-family-guardian links synced on SIS conversion.",
  },
];
