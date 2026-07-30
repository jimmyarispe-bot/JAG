import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JagSection } from "@/components/jag/command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { POWERED_BY_LINE } from "@/lib/platform/branding";

export const metadata: Metadata = {
  title: "Settings · Executive Intelligence Platform",
  description: "Command Center settings for the signed-in JAG platform role.",
};

export default async function JagSettingsPage() {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold tracking-tight text-[var(--jag-text)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--jag-muted)]">
          Command Center settings for the signed-in platform role.
        </p>
      </header>

      <JagSection
        title="Organization identity"
        description="Configure logos, colors, fonts, and tenant chrome. Customer brand is primary; The JAG™ is always secondary."
      >
        <Link
          href="/jag/settings/branding"
          className="inline-flex rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)] hover:border-[var(--jag-border-strong)]"
        >
          Open branding settings
        </Link>
        <p className="mt-3 text-xs text-[var(--jag-muted)]">{POWERED_BY_LINE}</p>
      </JagSection>
    </div>
  );
}
