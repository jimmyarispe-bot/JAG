import type { ImportTemplate } from "../types";

const LEAD_HEADERS = [
  "First Name",
  "Last Name",
  "DOB",
  "Current Grade",
  "Program",
  "Parent First Name",
  "Parent Last Name",
  "Parent Email",
  "Parent Phone",
  "Status",
  "Inquiry Date",
  "Referral Source",
  "Notes",
];

export const LEAD_TEMPLATES: ImportTemplate[] = [
  {
    id: "admissions_lead_new",
    entityType: "admissions_lead",
    name: "Admissions Pipeline Template",
    description:
      "Bulk import admissions leads with their pipeline position. Status accepts your existing admissions wording.",
    fileName: "admissions-leads-template.csv",
    headers: LEAD_HEADERS,
    sampleRows: [
      [
        "Jordan",
        "Rivera",
        "2015-04-12",
        "4th grade",
        "The Academy Virtual - Full-School Program",
        "Alex",
        "Rivera",
        "alex.rivera@example.com",
        "5551234567",
        "Interest Meeting Held",
        "2026-05-08",
        "Google search",
        "Reading support needed.",
      ],
      [
        "Sam",
        "Chen",
        "2013-09-30",
        "6th grade",
        "The Academy GA",
        "Pat",
        "Chen",
        "pat.chen@example.com",
        "5559876543",
        "Shadow Days Scheduled",
        "2026-05-02",
        "Referral",
        "",
      ],
    ],
  },
];
