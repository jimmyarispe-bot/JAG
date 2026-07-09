import { BrandingProvider } from "@/components/branding/BrandingContext";
import { loadOrganizationBranding } from "@/lib/branding";
import { createAuthClient } from "@/lib/supabase/server-auth";

export default async function ApplyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);

  return <BrandingProvider branding={branding}>{children}</BrandingProvider>;
}
