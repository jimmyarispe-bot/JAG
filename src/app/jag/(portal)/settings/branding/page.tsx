import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JagBrandingSettingsView } from "@/components/jag/command-center/branding";
import { loadBrandingSettingsWorkspace } from "@/lib/jag-command-center/branding";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Branding · Executive Intelligence Platform",
  description:
    "Multi-tenant organization branding for The JAG™ Executive Intelligence Platform.",
};

export default async function JagBrandingSettingsPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  const model = loadBrandingSettingsWorkspace(session, host);

  return <JagBrandingSettingsView model={model} />;
}
