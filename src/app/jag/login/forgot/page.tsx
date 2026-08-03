import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { JagForgotPasswordForm } from "@/components/jag-platform/JagForgotPasswordForm";
import { loadJagBrandForHost } from "@/lib/jag-command-center/branding";
import { POWERED_BY_LINE } from "@/lib/platform/branding";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  const model = loadJagBrandForHost(host);
  return {
    title: `Forgot password · ${model.pageTitle}`,
    description: `${model.pageTitle}. ${POWERED_BY_LINE}`,
    icons: model.theme.icons.favicon
      ? { icon: model.theme.icons.favicon }
      : undefined,
  };
}

export default async function JagForgotPasswordPage() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  const model = loadJagBrandForHost(host);
  const bg = model.brand.login_background_url;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: model.brand.primary_color || "#0F172A",
        backgroundImage: bg
          ? `linear-gradient(to bottom, color-mix(in srgb, ${model.brand.primary_color} 72%, transparent), color-mix(in srgb, ${model.brand.secondary_color} 88%, transparent)), url("${bg}")`
          : `linear-gradient(to bottom, ${model.brand.primary_color}, ${model.brand.secondary_color})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Suspense fallback={<p className="p-8 text-white">Loading…</p>}>
        <JagForgotPasswordForm brand={model.brand} />
      </Suspense>
    </div>
  );
}
