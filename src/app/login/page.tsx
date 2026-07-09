import { Suspense } from "react";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadOrganizationBranding, formatProductTitle } from "@/lib/branding";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createAuthClient();
  const branding = await loadOrganizationBranding(supabase);
  return {
    title: formatProductTitle(branding, "Sign In"),
    description: branding.productTagline,
  };
}

export default async function LoginPage() {
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
