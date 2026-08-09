import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagInboxView } from "@/components/jag/command-center/inbox";
import { loadExecutiveInbox } from "@/lib/jag-command-center/watchers";
import type { DigestKind } from "@/lib/platform/intelligence/watchers/index";
import { DIGEST_KINDS } from "@/lib/platform/intelligence/watchers/index";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Executive Inbox",
  description:
    "Proactive executive attention queue — risks, opportunities, and digests.",
};

function parseDigest(raw?: string): DigestKind | undefined {
  if (!raw) return undefined;
  return (DIGEST_KINDS as readonly string[]).includes(raw)
    ? (raw as DigestKind)
    : undefined;
}

export default async function JagInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; id?: string; digest?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Executive Inbox"
          description="Evaluating organizational conditions…"
          cards={4}
        />
      }
    >
      <InboxContent
        org={params.org}
        alertId={params.id}
        digest={parseDigest(params.digest)}
      />
    </Suspense>
  );
}

async function InboxContent({
  org,
  alertId,
  digest,
}: {
  org?: string;
  alertId?: string;
  digest?: DigestKind;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadExecutiveInbox(session, {
    organizationId: org,
    alertId,
    digest,
  });

  return <JagInboxView model={model} />;
}
