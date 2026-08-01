import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding, formatProductTitle } from "@/lib/branding";
import { isJagPlatformApexHost } from "@/lib/platform/branding";
import LoginForm from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  if (isJagPlatformApexHost(host)) {
    return {
      title: "Sign In",
      description: "Executive Intelligence Platform",
    };
  }

  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);
  return {
    title: formatProductTitle(branding, "Sign In"),
    description: branding.productTagline,
  };
}

/**
 * AcademyOS / school-app sign-in.
 * On the JAG production apex (`thejag.org` / `www.thejag.org`), send users to
 * the platform portal login so the public domain does not present generic
 * school-tenant fallback branding.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;

  if (isJagPlatformApexHost(host)) {
    const params = await searchParams;
    const next = params.next?.trim();
    const target =
      next && next.startsWith("/jag")
        ? `/jag/login?next=${encodeURIComponent(next)}`
        : "/jag/login";
    redirect(target);
  }

  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);

  return (
    <Suspense
      fallback={
        <main className="mx-auto mt-24 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <LoginForm branding={branding} />
    </Suspense>
  );
}
