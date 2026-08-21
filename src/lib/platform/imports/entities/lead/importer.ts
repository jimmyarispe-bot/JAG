import type { EntityImporter } from "../../types";
import { LEAD_TEMPLATES } from "../../templates/lead";
import { commitLeadRow } from "./commit";
import { LEAD_IMPORT_FIELDS } from "./fields";
import { validateLeadRow } from "./validate";

export const LeadImporter: EntityImporter = {
  entityType: "admissions_lead",
  displayName: "Admissions Pipeline",
  description:
    "Bulk import admissions leads with their pipeline position, preserving original status wording and outstanding staff follow-ups",
  fields: LEAD_IMPORT_FIELDS,
  templates: LEAD_TEMPLATES,
  validateRow: validateLeadRow,
  commitRow: async (mapped, destination, action, targetEntityId, helpers) =>
    commitLeadRow(mapped, destination, action, targetEntityId, helpers),
};

export function registerLeadImporter(
  register: (importer: EntityImporter, options?: { overwrite?: boolean }) => void
): void {
  register(LeadImporter, { overwrite: true });
}
