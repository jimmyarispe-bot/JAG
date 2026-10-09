import { notFound } from "next/navigation";
import { BrandingProvider } from "@/components/branding/BrandingContext";
import { loadOrganizationBranding } from "@/lib/branding";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * JIMMY ONLY.
 *
 * The middleware takes these thirteen pages off the public internet; it
 * cannot do more than that, because it authenticates and does not authorize
 * (see the note at the top of middleware.ts). Every teacher and school
 * leader has a session, so a session alone would still show them a
 * marketing site nobody wrote.
 *
 * notFound() rather than a redirect or an explanation. There is nothing here
 * for anyone else to be told about, and a page that says "you are not
 * allowed to see this" advertises that it exists.
 *
 * TO BRING ANY OF IT BACK: delete this guard and the two /admissions lines
 * in middleware.ts. The pages themselves were never touched.
 */
export default async function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getIdentityContext();
  const isFounder = Boolean(identity?.isFounder) || (identity?.roles ?? []).includes("FOUNDER");
  if (!isFounder) notFound();

  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);
  return <BrandingProvider branding={branding}>{children}</BrandingProvider>;
}
