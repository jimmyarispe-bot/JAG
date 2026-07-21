import { getImporter } from "../registry";
import type { ImportEntityType, ImportTemplate } from "../types";
import { STUDENT_TEMPLATES, templateToCsv } from "./student";

const EXTRA_TEMPLATES: ImportTemplate[] = [...STUDENT_TEMPLATES];

export function listTemplates(entityType?: ImportEntityType): ImportTemplate[] {
  if (!entityType) return EXTRA_TEMPLATES;
  const fromRegistry = getImporter(entityType)?.templates;
  if (fromRegistry?.length) {
    return fromRegistry.filter((t) => t.entityType === entityType);
  }
  return EXTRA_TEMPLATES.filter((t) => t.entityType === entityType);
}

export function getTemplate(templateId: string): ImportTemplate | null {
  return EXTRA_TEMPLATES.find((t) => t.id === templateId) ?? null;
}

export function downloadTemplateCsv(templateId: string): { fileName: string; csv: string } | null {
  const template = getTemplate(templateId);
  if (!template) return null;
  return { fileName: template.fileName, csv: templateToCsv(template) };
}

export { STUDENT_TEMPLATES, templateToCsv };
