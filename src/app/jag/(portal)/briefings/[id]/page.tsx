import Link from "next/link";
import { redirect } from "next/navigation";
import { JagBriefingDetailView } from "@/components/jag/command-center/briefings";
import type { BriefingViewMode } from "@/components/jag/command-center/briefings/JagBriefingToolbar";
import { JagSection } from "@/components/jag/command-center";
import { getBriefingDetail } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagBriefingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const { id } = await params;
  const sp = await searchParams;
  const mode = parseMode(sp.mode);
  const briefing = getBriefingDetail(session, id);

  if (!briefing) {
    return (
      <JagSection
        title="Executive Briefing"
        description="Not found in the briefing archive."
      >
        <div className="rounded-md border border-dashed border-[var(--jag-border)] px-4 py-8 text-sm text-[var(--jag-muted)]">
          This briefing is not available. It may have been cleared from the
          Command Center store, or the id is invalid.
        </div>
        <Link
          href="/jag/briefings"
          className="mt-4 inline-block text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Back to Executive Briefings
        </Link>
      </JagSection>
    );
  }

  return <JagBriefingDetailView briefing={briefing} mode={mode} />;
}

function parseMode(value?: string): BriefingViewMode {
  if (value === "print" || value === "board") return value;
  return "standard";
}
