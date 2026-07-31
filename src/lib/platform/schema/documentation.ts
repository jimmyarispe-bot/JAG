import { listRegisteredSchemas } from "@/lib/platform/schema/registry";
import { reflectSchema } from "@/lib/platform/schema/reflection";
import type { SchemaDocumentation } from "@/lib/platform/schema/types";

/**
 * Derive documentation from a registered (resolved) schema.
 * No hand-written domain docs required.
 */
export function generateSchemaDocumentation(
  schemaId: string
): SchemaDocumentation {
  const reflection = reflectSchema(schemaId);
  const title = `${reflection.entityType} schema (${reflection.schemaId})`;

  const fields = reflection.fields.map((f) => ({
    key: f.key,
    type: f.type,
    label: f.label,
    description: f.description ?? null,
  }));

  const relationships = reflection.relationships.map((r) => ({
    key: r.key,
    targetEntityType: r.targetEntityType,
    cardinality: r.cardinality,
    description: r.description ?? null,
  }));

  const forms = reflection.forms.map((f) => ({
    formId: f.formId,
    role: f.role ?? "custom",
  }));

  const workflows = reflection.workflows.map((w) => ({
    workflowId: w.workflowId,
    role: w.role ?? "primary",
  }));

  const permissions = reflection.permissions.map((p) => ({
    action: p.action,
    permission: p.permission,
  }));

  const lines: string[] = [
    `# ${title}`,
    "",
    `- **Entity type:** ${reflection.entityType}`,
    `- **Version:** ${reflection.version}`,
    `- **Layer:** ${reflection.layer}`,
  ];

  if (reflection.ancestors.length) {
    lines.push(`- **Extends:** ${reflection.ancestors.join(" ← ")}`);
  }

  lines.push("", "## Fields", "");
  if (!fields.length) {
    lines.push("_No fields registered._");
  } else {
    for (const f of fields) {
      lines.push(
        `- \`${f.key}\` (${f.type}) — ${f.label}${f.description ? `: ${f.description}` : ""}`
      );
    }
  }

  lines.push("", "## Relationships", "");
  if (!relationships.length) {
    lines.push("_No relationships registered._");
  } else {
    for (const r of relationships) {
      lines.push(
        `- \`${r.key}\` → \`${r.targetEntityType}\` (${r.cardinality})${r.description ? ` — ${r.description}` : ""}`
      );
    }
  }

  lines.push("", "## Forms", "");
  if (!forms.length) {
    lines.push("_No forms registered._");
  } else {
    for (const f of forms) {
      lines.push(`- \`${f.formId}\` (${f.role})`);
    }
  }

  lines.push("", "## Workflows", "");
  if (!workflows.length) {
    lines.push("_No workflows registered._");
  } else {
    for (const w of workflows) {
      lines.push(`- \`${w.workflowId}\` (${w.role})`);
    }
  }

  lines.push("", "## Permissions", "");
  if (!permissions.length) {
    lines.push("_No permissions registered._");
  } else {
    for (const p of permissions) {
      lines.push(`- \`${p.action}\` → \`${p.permission}\``);
    }
  }

  lines.push("", "## Indexes", "");
  if (!reflection.indexes.length) {
    lines.push("_No indexes registered._");
  } else {
    for (const idx of reflection.indexes) {
      lines.push(
        `- \`${idx.key}\`: ${idx.fields.join(", ")}${idx.unique ? " (unique)" : ""}`
      );
    }
  }

  lines.push("", "## Reports", "");
  if (!reflection.reports.length) {
    lines.push("_No reports registered._");
  } else {
    for (const report of reflection.reports) {
      lines.push(
        `- \`${report.id}\` — ${report.title} [${report.fields.join(", ")}]`
      );
    }
  }

  lines.push("");

  return {
    schemaId: reflection.schemaId,
    title,
    markdown: lines.join("\n"),
    fields,
    relationships,
    forms,
    workflows,
    permissions,
  };
}

export function generateAllSchemaDocumentation(): SchemaDocumentation[] {
  return listRegisteredSchemas().map((s) => generateSchemaDocumentation(s.id));
}
