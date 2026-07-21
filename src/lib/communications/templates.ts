import type { CommunicationTemplateRow, TemplateMergeContext } from "./types";

const VARIABLE_PATTERN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** Render template subject/body with {{Variable}} merge fields. */
export function renderTemplateString(
  template: string,
  context: TemplateMergeContext
): string {
  return template.replace(VARIABLE_PATTERN, (_match, key: string) => {
    const value = context[key];
    return value != null && value !== "" ? value : `{{${key}}}`;
  });
}

export function renderTemplate(
  template: Pick<CommunicationTemplateRow, "subject" | "body_text" | "body_html">,
  context: TemplateMergeContext
): { subject: string; bodyText: string; bodyHtml: string | null } {
  return {
    subject: renderTemplateString(template.subject, context),
    bodyText: renderTemplateString(template.body_text, context),
    bodyHtml: template.body_html
      ? renderTemplateString(template.body_html, context)
      : null,
  };
}

export function extractTemplateVariables(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1]);
  }
  return [...found];
}

export const DEFAULT_TEMPLATE_KEYS = [
  "welcome",
  "enrollment",
  "missing_documents",
  "scholarship_reminder",
  "tuition_reminder",
  "attendance",
  "schedule_change",
  "behavior",
  "progress_update",
  "graduation",
] as const;
