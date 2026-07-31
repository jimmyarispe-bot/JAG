import { listEndpoints } from "@/lib/platform/api/registry";
import type { ApiDocumentation, PlatformEndpoint } from "@/lib/platform/api/types";
import { getRegisteredSchema } from "@/lib/platform/schema/registry";
import { resolveSchema } from "@/lib/platform/schema/extensions";

function schemaFieldKeys(
  ref: PlatformEndpoint["requestSchema"]
): string[] {
  if (!ref) return [];
  const schema = getRegisteredSchema(ref.schemaId);
  if (!schema) return ref.fieldKeys ?? [];
  const resolved = resolveSchema(ref.schemaId);
  if (ref.fieldKeys?.length) {
    return ref.fieldKeys.filter((k) =>
      resolved.fields.some((f) => f.key === k)
    );
  }
  return resolved.fields.map((f) => f.key);
}

/**
 * Generate API documentation from endpoint registrations.
 * No manually maintained API docs.
 */
export function generateApiDocumentation(filter?: {
  applicationId?: string | null;
  includeDeprecated?: boolean;
}): ApiDocumentation {
  const endpoints = listEndpoints({
    applicationId: filter?.applicationId,
    includeDeprecated: filter?.includeDeprecated ?? true,
  });

  const docs = endpoints.map((ep) => ({
    id: ep.id,
    method: ep.method,
    path: ep.path,
    version: ep.version,
    deprecated: Boolean(ep.deprecated),
    summary: ep.summary ?? null,
    permissions: ep.permissions.map((p) => p.permission),
    requestSchemaId: ep.requestSchema?.schemaId ?? null,
    responseSchemaId: ep.responseSchema?.schemaId ?? null,
    requestFields: schemaFieldKeys(ep.requestSchema),
    responseFields: schemaFieldKeys(ep.responseSchema),
    compatibilityNotes: ep.compatibilityNotes ?? null,
  }));

  const lines: string[] = [
    "# Platform API",
    "",
    `_Generated from ${docs.length} registered endpoint(s)._`,
    "",
  ];

  for (const ep of docs) {
    lines.push(`## ${ep.method} \`${ep.path}\``);
    lines.push("");
    lines.push(`- **Id:** \`${ep.id}\``);
    lines.push(`- **Version:** \`${ep.version}\``);
    if (ep.deprecated) lines.push("- **Status:** deprecated");
    if (ep.summary) lines.push(`- **Summary:** ${ep.summary}`);
    if (ep.permissions.length) {
      lines.push(
        `- **Permissions:** ${ep.permissions.map((p) => `\`${p}\``).join(", ")}`
      );
    } else {
      lines.push("- **Permissions:** _(none configured)_");
    }
    if (ep.requestSchemaId) {
      lines.push(
        `- **Request schema:** \`${ep.requestSchemaId}\` [${ep.requestFields.join(", ") || "—"}]`
      );
    } else {
      lines.push("- **Request schema:** _(none)_");
    }
    if (ep.responseSchemaId) {
      lines.push(
        `- **Response schema:** \`${ep.responseSchemaId}\` [${ep.responseFields.join(", ") || "—"}]`
      );
    } else {
      lines.push("- **Response schema:** _(none)_");
    }
    if (ep.compatibilityNotes) {
      lines.push(`- **Compatibility:** ${ep.compatibilityNotes}`);
    }
    lines.push("");
  }

  if (!docs.length) {
    lines.push("_No endpoints registered. Platform ships empty._");
    lines.push("");
  }

  return {
    title: "Platform API",
    generatedAt: new Date().toISOString(),
    endpointCount: docs.length,
    markdown: lines.join("\n"),
    endpoints: docs,
  };
}
