import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import { JagGraphExplorerView } from "@/components/jag/command-center/explain";
import { loadGraphWorkspace } from "@/lib/jag-command-center/explain";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export const metadata: Metadata = {
  title: "Intelligence Graph · JAG",
  description:
    "Explainability layer — executive reasoning map from evidence to outcomes.",
};

export default async function JagGraphPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    focus?: string;
    q?: string;
    kind?: string;
    capability?: string;
    from?: string;
    to?: string;
    depth?: string;
  }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <JagLoadingSkeleton
          title="Intelligence Graph"
          description="Loading reasoning map…"
          cards={4}
        />
      }
    >
      <GraphContent params={params} />
    </Suspense>
  );
}

async function GraphContent({
  params,
}: {
  params: {
    org?: string;
    focus?: string;
    q?: string;
    kind?: string;
    capability?: string;
    from?: string;
    to?: string;
    depth?: string;
  };
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);

  const model = loadGraphWorkspace(session, {
    organizationId: params.org,
    focus: params.focus,
    q: params.q,
    kind: params.kind,
    capability: params.capability,
    from: params.from,
    to: params.to,
    depth: params.depth,
  });

  return <JagGraphExplorerView model={model} />;
}
