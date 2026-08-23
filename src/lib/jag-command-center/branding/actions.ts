"use server";

import { revalidatePath } from "next/cache";
import {
  AssetService,
  BrandService,
  type BrandAssetKind,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { assertSessionCanAccessOrganization } from "@/lib/jag-platform/data-plane";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { persistBrand } from "@/lib/platform/tenant/persistence";

export type BrandActionResult =
  | { readonly ok: true; readonly brand: OrganizationBrand }
  | { readonly ok: false; readonly error: string };

async function requireSession() {
  const session = await getJagPlatformSession();
  if (!session) {
    return { ok: false as const, error: `Sign in required (${JAG_PLATFORM_LOGIN_PATH}).` };
  }
  return { ok: true as const, session };
}

export async function saveOrganizationBrandAction(
  organizationId: string,
  partial: Partial<OrganizationBrand>
): Promise<BrandActionResult> {
  const auth = await requireSession();
  if (!auth.ok) return auth;

  const denied = assertSessionCanAccessOrganization(auth.session, organizationId);
  if (denied) return { ok: false, error: denied };

  const brand = BrandService.updateBrand(organizationId, partial);

  // In-memory alone does not survive the next deploy or cold start.
  const persisted = await persistBrand(brand);
  if (!persisted.ok) {
    return { ok: false, error: `Brand saved in memory but not stored: ${persisted.error}` };
  }

  revalidatePath("/jag");
  revalidatePath("/jag/settings");
  revalidatePath("/jag/settings/branding");
  revalidatePath("/jag/login");
  return { ok: true, brand };
}

export async function restoreOrganizationBrandDefaultsAction(
  organizationId: string
): Promise<BrandActionResult> {
  const auth = await requireSession();
  if (!auth.ok) return auth;

  const denied = assertSessionCanAccessOrganization(auth.session, organizationId);
  if (denied) return { ok: false, error: denied };

  const brand = BrandService.restoreDefaults(organizationId);

  const persisted = await persistBrand(brand);
  if (!persisted.ok) {
    return { ok: false, error: `Defaults restored in memory but not stored: ${persisted.error}` };
  }

  revalidatePath("/jag");
  revalidatePath("/jag/settings");
  revalidatePath("/jag/settings/branding");
  return { ok: true, brand };
}

export async function uploadBrandAssetAction(input: {
  readonly organizationId: string;
  readonly kind: BrandAssetKind;
  readonly url: string;
}): Promise<BrandActionResult> {
  const auth = await requireSession();
  if (!auth.ok) return auth;

  const denied = assertSessionCanAccessOrganization(
    auth.session,
    input.organizationId
  );
  if (denied) return { ok: false, error: denied };

  BrandService.ensureOrganization(
    input.organizationId,
    input.organizationId,
  );
  AssetService.setAsset(input.organizationId, input.kind, input.url.trim());
  const brand = BrandService.getBrand(input.organizationId);
  if (!brand) {
    return { ok: false, error: "Brand not found after asset upload." };
  }
  revalidatePath("/jag/settings/branding");
  revalidatePath("/jag");
  return { ok: true, brand };
}
