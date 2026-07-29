import Link from "next/link";
import { JagSection } from "../JagSection";
import type { JagCapabilityPackView } from "@/lib/jag-command-center";

export function JagCapabilityPacksSection({
  packs,
}: {
  readonly packs: readonly JagCapabilityPackView[];
}) {
  return (
    <JagSection
      title="Capability Packs"
      description="Loaded from listCapabilityPacks()."
      actions={
        <Link
          href="/jag/capability-packs"
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          View all
        </Link>
      }
    >
      {packs.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--jag-border)] px-4 py-6 text-sm text-[var(--jag-muted)]">
          No capability packs are registered.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {packs.map((pack) => (
            <article
              key={pack.id}
              className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-[var(--jag-text)]">
                  {pack.name}
                </h3>
                <span className="shrink-0 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
                  v{pack.version}
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div>
                  <dt className="text-[var(--jag-muted-2)]">Status</dt>
                  <dd className="capitalize text-[var(--jag-muted)]">
                    {pack.status.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--jag-muted-2)]">Contributors</dt>
                  <dd className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-muted)]">
                    {pack.contributorCount}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] text-[var(--jag-muted)]">
                Dependencies:{" "}
                {pack.dependencies.length === 0
                  ? "None"
                  : pack.dependencies.join(", ")}
              </p>
            </article>
          ))}
        </div>
      )}
    </JagSection>
  );
}
