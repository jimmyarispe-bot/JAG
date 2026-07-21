import type { EntityImporter, ImportEntityType, RegisterImporterOptions } from "./types";

const importers = new Map<ImportEntityType, EntityImporter>();

/**
 * Register an entity importer with the platform Bulk Import Engine.
 * Future: registerImporter(EmployeeImporter), registerImporter(ParentImporter), etc.
 */
export function registerImporter(
  importer: EntityImporter,
  options: RegisterImporterOptions = {}
): void {
  if (importers.has(importer.entityType) && !options.overwrite) {
    throw new Error(
      `Importer for entity type "${importer.entityType}" is already registered. Pass { overwrite: true } to replace.`
    );
  }
  importers.set(importer.entityType, importer);
}

export function getImporter(entityType: ImportEntityType): EntityImporter | null {
  return importers.get(entityType) ?? null;
}

export function requireImporter(entityType: ImportEntityType): EntityImporter {
  const importer = getImporter(entityType);
  if (!importer) {
    throw new Error(
      `No importer registered for entity type "${entityType}". Call registerImporter(...) during module bootstrap.`
    );
  }
  return importer;
}

export function listImporters(): EntityImporter[] {
  return [...importers.values()];
}

export function isImporterRegistered(entityType: ImportEntityType): boolean {
  return importers.has(entityType);
}

export function clearImporterRegistryForTests(): void {
  importers.clear();
}
