import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JagErrorState } from "@/components/jag/command-center";
import { ListeningSurveyPreview } from "@/components/jag/command-center/listening";
import { loadVersionDetail } from "@/lib/jag-command-center/listening";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { parseListeningSections } from "@/lib/platform/listening";

export const metadata: Metadata = {
  title: "Listening Preview · Executive Intelligence Platform",
};

export default async function JagListeningPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) redirect(JAG_PLATFORM_LOGIN_PATH);
  const { id } = await params;
  const { org } = await searchParams;
  const loaded = await loadVersionDetail(id, org);
  if (!loaded.ok) {
    return <JagErrorState title="Preview unavailable" description={loaded.error} />;
  }

  const title = loaded.instrument
    ? String(loaded.instrument.title)
    : `Version ${String(loaded.version.version_no)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/jag/listening/versions/${id}`}
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          ← Back to version
        </Link>
        <p className="text-xs text-[var(--jag-muted-2)]">
          Authenticated author preview · no public token
        </p>
      </div>
      <ListeningSurveyPreview
        title={title}
        introduction={
          typeof loaded.instrument?.description === "string"
            ? loaded.instrument.description
            : ""
        }
        sections={
          loaded.sections.length
            ? loaded.sections
            : parseListeningSections(loaded.version.metadata)
        }
        questions={loaded.questions as never}
      />
    </div>
  );
}
