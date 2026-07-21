import type { EntityImporter } from "../../types";
import { STUDENT_TEMPLATES } from "../../templates/student";
import { commitStudentRow } from "./commit";
import { STUDENT_IMPORT_FIELDS } from "./fields";
import { resolveStudentPreviewAction, validateStudentRow } from "./validate";

export const StudentImporter: EntityImporter = {
  entityType: "student",
  displayName: "Students",
  description: "Bulk import students with family and scholarship intelligence",
  fields: STUDENT_IMPORT_FIELDS,
  templates: STUDENT_TEMPLATES,
  validateRow: validateStudentRow,
  resolvePreviewAction: resolveStudentPreviewAction,
  commitRow: async (mapped, destination, action, targetEntityId, helpers) =>
    commitStudentRow(mapped, destination, action, targetEntityId, helpers),
};

export function registerStudentImporter(
  register: (importer: EntityImporter, options?: { overwrite?: boolean }) => void
): void {
  register(StudentImporter, { overwrite: true });
}
