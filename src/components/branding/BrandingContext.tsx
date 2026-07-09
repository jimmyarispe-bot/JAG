"use client";

import { createContext, useContext } from "react";
import type { OrganizationBranding } from "@/lib/branding/types";
import { buildFallbackBranding } from "@/lib/branding/defaults";

const BrandingContext = createContext<OrganizationBranding>(
  buildFallbackBranding("unknown", "School Platform")
);

export function BrandingProvider({
  branding,
  children,
}: {
  branding: OrganizationBranding;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding(): OrganizationBranding {
  return useContext(BrandingContext);
}
