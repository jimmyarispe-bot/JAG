import "./bootstrap";

export { ImportService } from "./service";
export { registerImporter, getImporter, requireImporter, listImporters } from "./registry";
export { bootstrapImportRegistry } from "./bootstrap";
export {
  canImportStudents,
  assertCanImportStudents,
  assertSchoolImportAccess,
  requireStudentImportAccess,
  STUDENT_IMPORT_ROLES,
} from "./access";
export { parseImportFile, detectFormat, registerParser } from "./parsers";
export { autoMapColumns, mapRecord } from "./mapping";
export { validateImportRows, buildErrorReportCsv } from "./validation";
export { buildImportPreview } from "./preview";
export { rollbackImportJob } from "./rollback";
export { getImportHistory, buildImportReportCsv } from "./history";
export { listTemplates, downloadTemplateCsv, STUDENT_TEMPLATES } from "./templates";
export { StudentImporter } from "./entities/student/importer";
export { recognizeScholarship } from "./entities/student/scholarship-intelligence";
export { familyGroupKey, applyFamilyGrouping } from "./entities/student/family-intelligence";
export { WIZARD_STEPS, EMPTY_COUNTS } from "./types";
export type * from "./types";
