import type {
  HrObjectType,
  HrProvider,
  HrRawEntity,
} from "@/lib/platform/integrations/connectors/hr/entities";
import {
  hrCatalogForProvider,
  objectTypesForHrProvider,
} from "@/lib/platform/integrations/connectors/hr/services/demo-catalog";

export type HrListPage = {
  records: HrRawEntity[];
  nextCursor: string | null;
};

export interface HrClient {
  readonly provider: HrProvider;
  authenticate(input: { accessToken: string }): Promise<{
    ok: boolean;
    error?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
  }>;
  refreshToken(refreshToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }>;
  health(): Promise<{ ok: boolean; latencyMs: number }>;
  list(
    organizationId: string,
    objectType: HrObjectType,
    since?: string | null,
    cursor?: string | null
  ): Promise<HrListPage>;
  objectTypes(): HrObjectType[];
}

export function createDemoHrClient(provider: HrProvider): HrClient {
  const catalog = hrCatalogForProvider(provider);
  const PAGE_SIZE = 50;

  return {
    provider,

    async authenticate(input) {
      if (!input.accessToken || input.accessToken === "invalid") {
        return { ok: false, error: `Invalid ${provider} access token` };
      }
      return {
        ok: true,
        accessToken: input.accessToken,
        refreshToken: `refresh-${provider}-${input.accessToken}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async refreshToken(refreshToken) {
      if (!refreshToken || refreshToken === "invalid") {
        return { ok: false, error: `Invalid ${provider} refresh token` };
      }
      return {
        ok: true,
        accessToken: `access-refreshed-${provider}-${Date.now()}`,
        refreshToken: `refresh-rotated-${provider}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async health() {
      return { ok: true, latencyMs: 28 };
    },

    async list(_organizationId, objectType, since, cursor) {
      const rows = catalog.filter((row) => {
        if (row.objectType !== objectType) return false;
        if (since && row.updatedAt < since) return false;
        return true;
      });
      const offset = cursor ? Number(cursor) || 0 : 0;
      const page = rows.slice(offset, offset + PAGE_SIZE);
      const next = offset + PAGE_SIZE < rows.length ? String(offset + PAGE_SIZE) : null;
      return { records: page, nextCursor: next };
    },

    objectTypes() {
      return objectTypesForHrProvider(provider);
    },
  };
}
