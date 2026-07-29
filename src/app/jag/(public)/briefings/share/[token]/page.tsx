import Link from "next/link";
import { JagBriefingDetailView } from "@/components/jag/command-center/briefings";
import type { BriefingViewMode } from "@/components/jag/command-center/briefings/JagBriefingToolbar";
import { JagSection } from "@/components/jag/command-center";
import { getSharedBriefingDetail } from "@/lib/jag-command-center";

/**
 * Read-only share surface — no session required.
 * Application-layer share tokens only.
 */
export default async function JagBriefingSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const mode: BriefingViewMode =
    sp.mode === "print" || sp.mode === "board" ? sp.mode : "standard";
  const briefing = getSharedBriefingDetail(token);

  if (!briefing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <JagSection
          title="Shared briefing"
          description="This read-only link is invalid or expired."
        >
          <p className="text-sm text-[var(--jag-muted)]">
            Ask the briefing owner to create a new share link from the Executive
            Briefings archive.
          </p>
          <Link
            href="/jag/briefings"
            className="mt-4 inline-block text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            Executive Briefings
          </Link>
        </JagSection>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="mb-4 text-xs text-[var(--jag-muted)]">
        Read-only shared briefing · actions disabled
      </p>
      <JagBriefingDetailView
        briefing={briefing}
        mode={mode}
        readOnly
      />
    </div>
  );
}
