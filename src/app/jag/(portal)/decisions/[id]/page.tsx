import Link from "next/link";
import { redirect } from "next/navigation";
import { JagDecisionDetailView } from "@/components/jag/command-center/decisions";
import { JagSection } from "@/components/jag/command-center";
import { getDecisionCenterDetail } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagDecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const { id } = await params;
  const detail = getDecisionCenterDetail(session, id);

  if (!detail) {
    return (
      <JagSection title="Decision" description="Not found in the queue.">
        <div className="rounded-md border border-dashed border-[var(--jag-border)] px-4 py-8 text-sm text-[var(--jag-muted)]">
          This decision is not projected from a bound action proposal. It may
          have been cleared from the Command Center store, or the id is invalid.
        </div>
        <Link
          href="/jag/decisions"
          className="mt-4 inline-block text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Back to Decision Center
        </Link>
      </JagSection>
    );
  }

  return <JagDecisionDetailView detail={detail} />;
}
