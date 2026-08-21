import type { ImportFieldDefinition } from "../../types";

/**
 * Admissions lead import fields.
 *
 * Aliases include the normalized headers of The Academy Way's legacy export
 * (`parent_1_email`, `student_1_gurrent_grade_level` — the typo is in the
 * source and is matched deliberately) so a straight export auto-maps with no
 * manual mapping step.
 */
export const LEAD_IMPORT_FIELDS: ImportFieldDefinition[] = [
  {
    key: "first_name",
    label: "First Name",
    required: true,
    aliases: ["firstname", "student_first_name", "fname", "given_name", "student_1_first_name"],
  },
  {
    key: "last_name",
    label: "Last Name",
    required: true,
    aliases: ["lastname", "student_last_name", "lname", "surname", "student_1_last_name"],
  },
  {
    key: "preferred_name",
    label: "Preferred Name",
    aliases: ["nickname", "goes_by"],
  },
  {
    key: "date_of_birth",
    label: "DOB",
    aliases: ["dob", "birthdate", "birth_date", "student_1_birthdate"],
    dataType: "date",
  },
  {
    key: "current_grade",
    label: "Current Grade",
    aliases: ["grade", "grade_level", "student_1_gurrent_grade_level", "student_1_current_grade_level"],
  },
  {
    key: "applying_for_grade",
    label: "Applying For Grade",
    aliases: ["applying_grade", "entering_grade", "grade_applying_for"],
  },
  {
    key: "program",
    label: "Program",
    aliases: ["academy", "which_academy_are_you_interested_in", "program_code", "track"],
  },
  {
    key: "guardian_first_name",
    label: "Parent First Name",
    aliases: ["parent_first_name", "parent_1_first_name", "guardian_first"],
  },
  {
    key: "guardian_last_name",
    label: "Parent Last Name",
    aliases: ["parent_last_name", "parent_1_last_name", "guardian_last"],
  },
  {
    key: "guardian_email",
    label: "Parent Email",
    aliases: ["parent_email", "parent_1_email", "email", "guardian_email_address"],
    dataType: "email",
  },
  {
    key: "guardian_phone",
    label: "Parent Phone",
    aliases: ["parent_phone", "parent_1_phone", "phone", "mobile"],
    dataType: "phone",
  },
  {
    key: "lead_status",
    label: "Status",
    required: true,
    aliases: ["select_status", "stage", "lead_stage", "pipeline_status"],
  },
  {
    key: "inquiry_date",
    label: "Inquiry Date",
    aliases: ["submission_date", "date_submitted", "created", "inquiry_submitted"],
    dataType: "date",
  },
  {
    key: "referral_source",
    label: "Referral Source",
    aliases: [
      "where_how_did_you_learn_about_our_school",
      "how_did_you_hear_about_us",
      "source",
      "lead_source",
    ],
  },
  {
    key: "notes",
    label: "Notes",
    aliases: ["admissions_notes", "comments", "memo", "remark"],
  },
  {
    key: "assigned_to",
    label: "Assigned To",
    aliases: ["people", "owner", "admissions_rep", "assigned_staff"],
  },
  {
    key: "source_record_id",
    label: "Source Record ID",
    aliases: ["item_id_auto_generated", "item_id", "legacy_id", "external_id"],
  },
];
