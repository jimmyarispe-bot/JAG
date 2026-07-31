/**
 * ReportModel — declarative report definition contribution.
 * Registered via compiler ports (catalog contribution).
 */

export type ReportModel = {
  readonly id: string;
  readonly applicationId: string;
  readonly title: string;
  readonly domain: string;
  readonly entityType: string | null;
  readonly fields: readonly string[];
  readonly requiredPermission: string;
  readonly version: string;
};
