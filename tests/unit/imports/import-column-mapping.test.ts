import { describe, expect, it } from "vitest";

import {
  autoMapColumns,
  unmappedRequiredFields,
} from "@/lib/platform/imports/mapping";
import { LEAD_IMPORT_FIELDS } from "@/lib/platform/imports/entities/lead/fields";
import { STUDENT_IMPORT_FIELDS } from "@/lib/platform/imports/entities/student/fields";
import type { FieldMapping } from "@/lib/platform/imports/types";

/**
 * Regression cover for the 2026-08-31 admissions lead import, in which seven
 * leads were created with the PARENT's name in the child's first_name and
 * last_name columns. "Parent First Name" normalizes to `parent_first_name`,
 * which contains `first_name`, so it scored 0.75 against the student's own
 * field -- and nothing stopped one source column from filling two targets.
 */

/** The exact header row from the .xlsx that produced the bad import. */
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
  "Assigned To",
  "Source Record ID",
];

function sourceFor(mappings: FieldMapping[], target: string): string | undefined {
  return mappings.find((m) => m.targetField === target && m.sourceField)?.sourceField;
}

describe("autoMapColumns - the full lead header row", () => {
  const mappings = autoMapColumns(LEAD_HEADERS, LEAD_IMPORT_FIELDS);

  it("maps the child's name to the child's columns", () => {
    expect(sourceFor(mappings, "first_name")).toBe("First Name");
    expect(sourceFor(mappings, "last_name")).toBe("Last Name");
  });

  it("maps the parent's name to the guardian columns", () => {
    expect(sourceFor(mappings, "guardian_first_name")).toBe("Parent First Name");
    expect(sourceFor(mappings, "guardian_last_name")).toBe("Parent Last Name");
  });

  it("maps every remaining column to the field it names", () => {
    expect(sourceFor(mappings, "date_of_birth")).toBe("DOB");
    expect(sourceFor(mappings, "current_grade")).toBe("Current Grade");
    expect(sourceFor(mappings, "program")).toBe("Program");
    expect(sourceFor(mappings, "guardian_email")).toBe("Parent Email");
    expect(sourceFor(mappings, "guardian_phone")).toBe("Parent Phone");
    expect(sourceFor(mappings, "lead_status")).toBe("Status");
    expect(sourceFor(mappings, "inquiry_date")).toBe("Inquiry Date");
    expect(sourceFor(mappings, "referral_source")).toBe("Referral Source");
    expect(sourceFor(mappings, "notes")).toBe("Notes");
    expect(sourceFor(mappings, "assigned_to")).toBe("Assigned To");
    expect(sourceFor(mappings, "source_record_id")).toBe("Source Record ID");
  });

  it("leaves no required field unmapped", () => {
    expect(unmappedRequiredFields(mappings, LEAD_IMPORT_FIELDS)).toEqual([]);
  });
});

describe("autoMapColumns - the child's own column is missing", () => {
  // This is the shape the matcher is handed when the header list is
  // reconstructed from a row rather than read from raw_headers.
  const headers = LEAD_HEADERS.filter((h) => h !== "First Name");
  const mappings = autoMapColumns(headers, LEAD_IMPORT_FIELDS);

  it("does not fall back to the parent's column for the child's name", () => {
    expect(sourceFor(mappings, "first_name")).toBeUndefined();
  });

  it("reports first_name as an unmapped required field", () => {
    expect(unmappedRequiredFields(mappings, LEAD_IMPORT_FIELDS)).toContain("first_name");
  });

  it("still emits a placeholder row for the unmapped required field", () => {
    const placeholder = mappings.find((m) => m.targetField === "first_name");
    expect(placeholder).toBeDefined();
    expect(placeholder?.sourceField).toBe("");
    expect(placeholder?.required).toBe(true);
  });

  it("keeps the parent's column on the guardian field", () => {
    expect(sourceFor(mappings, "guardian_first_name")).toBe("Parent First Name");
  });
});

describe("autoMapColumns - exclusivity", () => {
  it("never consumes one source column for two target fields", () => {
    for (const headers of [LEAD_HEADERS, LEAD_HEADERS.filter((h) => h !== "First Name")]) {
      const used = autoMapColumns(headers, LEAD_IMPORT_FIELDS)
        .filter((m) => m.sourceField)
        .map((m) => m.sourceField);
      expect(new Set(used).size).toBe(used.length);
    }
  });

  it("never consumes one source column for two target fields on the student importer", () => {
    const headers = [
      "First Name",
      "Last Name",
      "DOB",
      "Grade",
      "Parent Name",
      "Parent Email",
      "Parent Phone",
      "Address",
      "City",
      "State",
      "Zip",
      "Notes",
    ];
    const used = autoMapColumns(headers, STUDENT_IMPORT_FIELDS)
      .filter((m) => m.sourceField)
      .map((m) => m.sourceField);
    expect(new Set(used).size).toBe(used.length);
  });

  it("never assigns one target field twice", () => {
    const targets = autoMapColumns(LEAD_HEADERS, LEAD_IMPORT_FIELDS).map((m) => m.targetField);
    expect(new Set(targets).size).toBe(targets.length);
  });
});

describe("scoreMatch - qualifier boundaries", () => {
  it("refuses a parent column for a child field even when it is the only candidate", () => {
    const mappings = autoMapColumns(["Parent First Name"], LEAD_IMPORT_FIELDS);
    expect(sourceFor(mappings, "first_name")).toBeUndefined();
    expect(sourceFor(mappings, "guardian_first_name")).toBe("Parent First Name");
  });

  it("refuses a guardian column for a child field", () => {
    const mappings = autoMapColumns(["Guardian Last Name Legal"], LEAD_IMPORT_FIELDS);
    expect(sourceFor(mappings, "last_name")).toBeUndefined();
  });

  it("still allows a partial match inside the same qualifier group", () => {
    const mappings = autoMapColumns(["Parent Phone Number"], LEAD_IMPORT_FIELDS);
    expect(sourceFor(mappings, "guardian_phone")).toBe("Parent Phone Number");
  });

  it("still allows a partial match when neither side is qualified", () => {
    const mappings = autoMapColumns(["Notes Field"], LEAD_IMPORT_FIELDS);
    expect(sourceFor(mappings, "notes")).toBe("Notes Field");
  });
});

describe("legitimate aliases still resolve", () => {
  const cases: Array<[string, string]> = [
    ["firstname", "first_name"],
    ["FirstName", "first_name"],
    ["Student First Name", "first_name"],
    ["student_1_first_name", "first_name"],
    ["fname", "first_name"],
    ["Given Name", "first_name"],
    ["lastname", "last_name"],
    ["Student Last Name", "last_name"],
    ["student_1_last_name", "last_name"],
    ["lname", "last_name"],
    ["Surname", "last_name"],
    ["dob", "date_of_birth"],
    ["Birthdate", "date_of_birth"],
    ["student_1_birthdate", "date_of_birth"],
    ["Grade Level", "current_grade"],
    ["student_1_gurrent_grade_level", "current_grade"],
    ["Nickname", "preferred_name"],
    ["Goes By", "preferred_name"],
    ["Entering Grade", "applying_for_grade"],
    ["Which Academy Are You Interested In", "program"],
    ["parent_1_first_name", "guardian_first_name"],
    ["Guardian First", "guardian_first_name"],
    ["parent_1_last_name", "guardian_last_name"],
    ["Guardian Last", "guardian_last_name"],
    ["parent_1_email", "guardian_email"],
    ["Email", "guardian_email"],
    ["Guardian Email Address", "guardian_email"],
    ["parent_1_phone", "guardian_phone"],
    ["Mobile", "guardian_phone"],
    ["Select Status", "lead_status"],
    ["Pipeline Status", "lead_status"],
    ["Submission Date", "inquiry_date"],
    ["How Did You Hear About Us", "referral_source"],
    ["Admissions Notes", "notes"],
    ["Owner", "assigned_to"],
    ["item_id_auto_generated", "source_record_id"],
  ];

  it.each(cases)("maps %s to %s on the lead importer", (header, target) => {
    const mappings = autoMapColumns([header], LEAD_IMPORT_FIELDS);
    expect(sourceFor(mappings, target)).toBe(header);
  });

  const studentCases: Array<[string, string]> = [
    ["firstname", "first_name"],
    ["student_first_name", "first_name"],
    ["fname", "first_name"],
    ["given_name", "first_name"],
    ["surname", "last_name"],
    ["lname", "last_name"],
    ["family_name", "last_name"],
    ["Guardian Name", "parent_name"],
    ["Mother", "parent_name"],
    ["Father", "parent_name"],
    ["Primary Parent", "parent_name"],
    ["Guardian Email", "parent_email"],
    ["Billing Email", "parent_email"],
    ["Guardian Phone", "parent_phone"],
    ["Parent Mobile", "parent_phone"],
    ["Street Address", "address"],
    ["Postal Code", "zip"],
    ["Town", "city"],
    ["Province", "state"],
    ["Sex", "gender"],
    ["Funding Source", "scholarship"],
    ["Emergency Name", "emergency_contact"],
  ];

  it.each(studentCases)("maps %s to %s on the student importer", (header, target) => {
    const mappings = autoMapColumns([header], STUDENT_IMPORT_FIELDS);
    expect(sourceFor(mappings, target)).toBe(header);
  });
});

describe("the legacy Academy Way export still auto-maps", () => {
  it("maps every legacy column to the field it was aliased for", () => {
    const headers = [
      "student_1_first_name",
      "student_1_last_name",
      "student_1_birthdate",
      "student_1_gurrent_grade_level",
      "which_academy_are_you_interested_in",
      "parent_1_first_name",
      "parent_1_last_name",
      "parent_1_email",
      "parent_1_phone",
      "select_status",
      "submission_date",
      "where_how_did_you_learn_about_our_school",
      "item_id_auto_generated",
    ];
    const mappings = autoMapColumns(headers, LEAD_IMPORT_FIELDS);

    expect(sourceFor(mappings, "first_name")).toBe("student_1_first_name");
    expect(sourceFor(mappings, "last_name")).toBe("student_1_last_name");
    expect(sourceFor(mappings, "guardian_first_name")).toBe("parent_1_first_name");
    expect(sourceFor(mappings, "guardian_last_name")).toBe("parent_1_last_name");
    expect(sourceFor(mappings, "guardian_email")).toBe("parent_1_email");
    expect(sourceFor(mappings, "guardian_phone")).toBe("parent_1_phone");
    expect(sourceFor(mappings, "date_of_birth")).toBe("student_1_birthdate");
    expect(sourceFor(mappings, "current_grade")).toBe("student_1_gurrent_grade_level");
    expect(sourceFor(mappings, "program")).toBe("which_academy_are_you_interested_in");
    expect(sourceFor(mappings, "lead_status")).toBe("select_status");
    expect(sourceFor(mappings, "inquiry_date")).toBe("submission_date");
    expect(sourceFor(mappings, "referral_source")).toBe(
      "where_how_did_you_learn_about_our_school"
    );
    expect(sourceFor(mappings, "source_record_id")).toBe("item_id_auto_generated");
    expect(unmappedRequiredFields(mappings, LEAD_IMPORT_FIELDS)).toEqual([]);
  });
});

describe("confidence is reported honestly", () => {
  it("marks exact matches 1 and partial matches below 1", () => {
    const mappings = autoMapColumns(["First Name", "Notes Field"], LEAD_IMPORT_FIELDS);
    expect(mappings.find((m) => m.targetField === "first_name")?.confidence).toBe(1);
    expect(mappings.find((m) => m.targetField === "notes")?.confidence).toBeLessThan(1);
  });

  it("gives every column of the real header row full confidence", () => {
    const mappings = autoMapColumns(LEAD_HEADERS, LEAD_IMPORT_FIELDS);
    for (const m of mappings.filter((x) => x.sourceField)) {
      expect(m.confidence).toBe(1);
    }
  });
});
