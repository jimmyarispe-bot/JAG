import { resetDocumentExtensionsForTests } from "@/jag/documents/contracts/extensions";
import { resetDocumentEventsForTests } from "@/jag/documents/events";
import {
  getDocumentCategory,
  registerDocument,
  registerDocumentCategory,
  resetDocumentRegistryForTests,
} from "@/jag/documents/registry";
import {
  resetDocumentClockForTests,
  resetDocumentIdsForTests,
  resetDocumentInstanceStoreForTests,
  setDocumentClockForTests,
  setDocumentIdPrefixForTests,
} from "@/jag/documents/runtime";
import { resetDocumentPersistenceForTests } from "@/jag/documents/storage";
import { resetDocumentTelemetryForTests } from "@/jag/documents/telemetry";
import type { DocumentDefinition } from "@/jag/documents/contracts/definitions";

export function resetDocumentEngineForTests(): void {
  resetDocumentRegistryForTests();
  resetDocumentInstanceStoreForTests();
  resetDocumentIdsForTests();
  resetDocumentClockForTests();
  resetDocumentEventsForTests();
  resetDocumentTelemetryForTests();
  resetDocumentExtensionsForTests();
  resetDocumentPersistenceForTests();
}

export function freezeDocumentEngineForTests(input?: {
  now?: Date;
  idPrefix?: string;
}): void {
  const now = input?.now ?? new Date("2026-01-15T12:00:00.000Z");
  resetDocumentIdsForTests();
  setDocumentClockForTests(() => now);
  setDocumentIdPrefixForTests(input?.idPrefix ?? "test");
}

/** Minimal generic document definition — no industry semantics. */
export function createTestDocumentDefinition(
  overrides?: Partial<DocumentDefinition> & { id?: string; categoryId?: string }
): DocumentDefinition {
  const categoryId = overrides?.categoryId ?? "cat.general";
  if (!getDocumentCategory(categoryId)) {
    registerDocumentCategory({
      id: categoryId,
      label: "General",
    });
  }

  const id = overrides?.id ?? "test.document.generic";
  return {
    id,
    applicationId: overrides?.applicationId ?? "test-app",
    version: overrides?.version ?? "1.0.0",
    label: overrides?.label ?? "Generic Test Document",
    description: overrides?.description,
    categoryId,
    defaultClassification: overrides?.defaultClassification ?? "internal",
    allowedClassifications: overrides?.allowedClassifications ?? [
      "public",
      "internal",
      "confidential",
      "restricted",
      "archival",
    ],
    templateIds: overrides?.templateIds,
    permissions: overrides?.permissions,
    dependsOn: overrides?.dependsOn,
    metadataSchema: overrides?.metadataSchema,
    extensions: overrides?.extensions,
  };
}

export function registerTestDocument(
  overrides?: Partial<DocumentDefinition> & { id?: string; categoryId?: string }
): DocumentDefinition {
  return registerDocument(createTestDocumentDefinition(overrides));
}
