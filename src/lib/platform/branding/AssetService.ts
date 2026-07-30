/**
 * Sprint 211 — In-memory brand asset store.
 */

import { BrandRegistry } from "./BrandRegistry";
import { recordBrandObservation } from "./BrandObservability";
import type { BrandAssetKind, OrganizationBrand } from "./types";

export type BrandAssetRecord = {
  organizationId: string;
  kind: BrandAssetKind;
  url: string;
  updatedAt: string;
};

const assets = new Map<string, BrandAssetRecord>();

function assetKey(organizationId: string, kind: BrandAssetKind): string {
  return `${organizationId}::${kind}`;
}

const KIND_TO_URL_FIELD: Record<
  BrandAssetKind,
  keyof Pick<
    OrganizationBrand,
    | "light_logo_url"
    | "dark_logo_url"
    | "favicon_url"
    | "app_icon_url"
    | "login_background_url"
    | "dashboard_background_url"
  >
> = {
  light_logo: "light_logo_url",
  dark_logo: "dark_logo_url",
  favicon: "favicon_url",
  app_icon: "app_icon_url",
  login_background: "login_background_url",
  dashboard_background: "dashboard_background_url",
};

function syncBrandUrl(
  organizationId: string,
  kind: BrandAssetKind,
  url: string
): void {
  const existing = BrandRegistry.getByOrganizationId(organizationId);
  if (!existing) return;
  const field = KIND_TO_URL_FIELD[kind];
  BrandRegistry.upsert({
    ...existing,
    [field]: url,
  });
}

export const AssetService = {
  setAsset(
    organizationId: string,
    kind: BrandAssetKind,
    url: string
  ): BrandAssetRecord {
    const record: BrandAssetRecord = {
      organizationId,
      kind,
      url,
      updatedAt: new Date().toISOString(),
    };
    assets.set(assetKey(organizationId, kind), record);
    syncBrandUrl(organizationId, kind, url);

    const isLogo =
      kind === "light_logo" || kind === "dark_logo" || kind === "app_icon";
    recordBrandObservation({
      kind: isLogo ? "logo_upload" : "asset_change",
      organizationId,
      detail: `Set ${kind} → ${url || "(empty)"}`,
    });

    return record;
  },

  getAsset(
    organizationId: string,
    kind: BrandAssetKind
  ): BrandAssetRecord | null {
    return assets.get(assetKey(organizationId, kind)) ?? null;
  },

  listAssets(organizationId: string): readonly BrandAssetRecord[] {
    return Array.from(assets.values()).filter(
      (a) => a.organizationId === organizationId
    );
  },

  resetForTests(): void {
    assets.clear();
  },
};
