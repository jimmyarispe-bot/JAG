/**
 * Platform Bulk Import Service — public façade for the import engine.
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  commitImport,
  runAutoMapping,
  runPreview,
  runValidation,
  setDestination,
  uploadAndCreateJob,
} from "./engine";
import { getImportHistory, buildImportReportCsv } from "./history";
import { getImportJob } from "./jobs";
import { listImporters, registerImporter, getImporter, requireImporter } from "./registry";
import { rollbackImportJob } from "./rollback";
import { downloadTemplateCsv, listTemplates } from "./templates";
import type {
  EntityImporter,
  FieldMapping,
  ImportDestination,
  ImportEntityType,
  RegisterImporterOptions,
} from "./types";
import type { FileParseInput } from "./parsers";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export const ImportService = {
  registerImporter(importer: EntityImporter, options?: RegisterImporterOptions) {
    registerImporter(importer, options);
  },

  listImporters,
  getImporter,
  requireImporter,

  async upload(
    supabase: AuthClient,
    input: FileParseInput & {
      entityType: ImportEntityType;
      organizationId?: string | null;
      importedBy?: string | null;
    }
  ) {
    return uploadAndCreateJob(supabase, input);
  },

  async configureDestination(
    supabase: AuthClient,
    jobId: string,
    destination: ImportDestination,
    organizationId?: string | null
  ) {
    return setDestination(supabase, jobId, destination, organizationId);
  },

  async mapColumns(supabase: AuthClient, jobId: string, overrides?: FieldMapping[]) {
    return runAutoMapping(supabase, jobId, overrides);
  },

  async validate(supabase: AuthClient, jobId: string, mappings?: FieldMapping[]) {
    return runValidation(supabase, jobId, mappings);
  },

  async preview(supabase: AuthClient, jobId: string) {
    return runPreview(supabase, jobId);
  },

  async commit(supabase: AuthClient, jobId: string) {
    return commitImport(supabase, jobId);
  },

  async history(
    supabase: AuthClient,
    options?: { organizationId?: string | null; schoolId?: string | null; limit?: number }
  ) {
    return getImportHistory(supabase, options);
  },

  async getJob(supabase: AuthClient, jobId: string) {
    return getImportJob(supabase, jobId);
  },

  async rollback(supabase: AuthClient, jobId: string) {
    return rollbackImportJob(supabase, jobId);
  },

  listTemplates,
  downloadTemplateCsv,
  buildImportReportCsv,
};

export type { EntityImporter };
