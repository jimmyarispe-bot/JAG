/**
 * Template rendering — JAG owns rendering; packages own template content.
 */

import type { CommunicationTemplate } from "@/jag/communications/contracts/definitions";

function readPath(
  variables: Readonly<Record<string, unknown>>,
  path: string
): unknown {
  const parts = path.split(".");
  let current: unknown = variables;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/** Replace `{{path}}` placeholders. Unresolved tokens are left intact. */
export function renderCommunicationTemplate(input: {
  template: CommunicationTemplate;
  variables: Readonly<Record<string, unknown>>;
}): { subject?: string; body: string; unresolved: string[] } {
  const unresolved = new Set<string>();

  const render = (text: string): string =>
    text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, path: string) => {
      const value = readPath(input.variables, path);
      if (value === undefined || value === null) {
        unresolved.add(path);
        return `{{${path}}}`;
      }
      return String(value);
    });

  return {
    subject: input.template.subject
      ? render(input.template.subject)
      : undefined,
    body: render(input.template.body),
    unresolved: [...unresolved].sort(),
  };
}
