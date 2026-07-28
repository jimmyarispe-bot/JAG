import { newId } from "../ids";
import { kstore } from "../store";
import type { DocumentDomain, DocumentTypeDefinition } from "../types";
import { DOCUMENT_TYPE_PRESETS, presetAsDefinition } from "./presets";

export function ensureSystemDocumentTypes(): readonly DocumentTypeDefinition[] {
  const existing = kstore.listTypes("__system__");
  const hasPresets = existing.some((t) => t.systemPreset);
  if (!hasPresets) {
    for (const p of DOCUMENT_TYPE_PRESETS) {
      kstore.upsertType(presetAsDefinition(p));
    }
  }
  return Object.freeze(DOCUMENT_TYPE_PRESETS.map(presetAsDefinition));
}

export function registerDocumentType(input: {
  organizationId: string;
  key: string;
  label: string;
  domain: DocumentDomain;
}): DocumentTypeDefinition {
  ensureSystemDocumentTypes();
  const key = input.key.trim().toLowerCase().replace(/\s+/g, "_");
  const existing = kstore
    .listTypes(input.organizationId)
    .find((t) => t.key === key && t.organizationId === input.organizationId);
  if (existing) return existing;
  return kstore.upsertType({
    id: newId("dtype"),
    organizationId: input.organizationId,
    key,
    label: input.label.trim() || key,
    domain: input.domain,
    active: true,
    systemPreset: false,
    // createdAt not on type — keep lean
  });
}

export function resolveDocumentType(
  organizationId: string,
  typeKey: string
): DocumentTypeDefinition {
  ensureSystemDocumentTypes();
  const key = typeKey.trim().toLowerCase();
  const found = kstore
    .listTypes(organizationId)
    .find((t) => t.key === key);
  if (found) return found;
  return registerDocumentType({
    organizationId,
    key,
    label: key,
    domain: "custom",
  });
}

export function listDocumentTypes(
  organizationId: string
): readonly DocumentTypeDefinition[] {
  ensureSystemDocumentTypes();
  return kstore.listTypes(organizationId);
}

export { DOCUMENT_TYPE_PRESETS };
