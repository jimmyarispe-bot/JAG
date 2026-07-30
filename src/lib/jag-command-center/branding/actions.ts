"use server";

import { revalidatePath } from "next/cache";
import {
  AssetService,
  BrandService,
  type BrandAssetKind,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

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

  if (!organizationId.trim()) {
    return { ok: false, error: "organizationId is required." };
  }

  const brand = BrandService.updateBrand(organizationId, partial);
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

  if (!organizationId.trim()) {
    return { ok: false, error: "organizationId is required." };
  }

  const brand = BrandService.restoreDefaults(organizationId);
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

  if (!input.organizationId.trim()) {
    return { ok: false, error: "organizationId is required." };
  }

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
