import type { ImportFieldDefinition } from "../../types";

export const STUDENT_IMPORT_FIELDS: ImportFieldDefinition[] = [
  {
    key: "first_name",
    label: "First Name",
    required: true,
    aliases: ["firstname", "student_first_name", "fname", "given_name"],
  },
  {
    key: "last_name",
    label: "Last Name",
    required: true,
    aliases: ["lastname", "student_last_name", "lname", "surname", "family_name"],
  },
  {
    key: "date_of_birth",
    label: "DOB",
    aliases: ["dob", "birthdate", "birth_date", "date_of_birth"],
    dataType: "date",
  },
  {
    key: "grade_level",
    label: "Grade",
    aliases: ["grade", "grade_level", "current_grade"],
  },
  {
    key: "gender",
    label: "Gender",
    aliases: ["sex"],
  },
  {
    key: "parent_name",
    label: "Parent Name",
    aliases: ["guardian_name", "parent", "primary_parent", "mother", "father"],
  },
  {
    key: "parent_email",
    label: "Parent Email",
    aliases: ["guardian_email", "email", "parent_email_address", "billing_email"],
    dataType: "email",
  },
  {
    key: "parent_phone",
    label: "Parent Phone",
    aliases: ["guardian_phone", "phone", "mobile", "parent_mobile"],
    dataType: "phone",
  },
  {
    key: "scholarship",
    label: "Scholarship",
    aliases: ["funding", "funding_source", "scholarship_type", "pay_type"],
  },
  {
    key: "address",
    label: "Address",
    aliases: ["street", "street_address", "primary_address", "home_address"],
  },
  {
    key: "city",
    label: "City",
    aliases: ["town"],
  },
  {
    key: "state",
    label: "State",
    aliases: ["province", "region"],
  },
  {
    key: "zip",
    label: "Zip",
    aliases: ["zip_code", "postal", "postal_code"],
  },
  {
    key: "emergency_contact",
    label: "Emergency Contact",
    aliases: ["emergency", "emergency_name"],
  },
  {
    key: "notes",
    label: "Notes",
    aliases: ["comments", "memo", "remark"],
  },
  {
    key: "program",
    label: "Program",
    aliases: ["program_code", "track"],
  },
  {
    key: "preferred_name",
    label: "Preferred Name",
    aliases: ["nickname"],
  },
  {
    key: "enrollment_status",
    label: "Enrollment Status",
    aliases: ["status", "enrollment", "student_status"],
    dataType: "enum",
  },
];
