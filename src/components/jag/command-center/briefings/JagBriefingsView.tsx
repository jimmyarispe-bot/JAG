import Link from "next/link";
import type { JagBriefingListModel } from "@/lib/jag-command-center/briefing-engine/types";
import { JagSection } from "../JagSection";
import { JagBriefingGenerateForm } from "./JagBriefingGenerateForm";

export function JagBriefingsView({
  model,
}: {
  readonly model: JagBriefingListModel;
}) {
  return (
    <div className="space-y-6">
      <JagSection
        title="Executive Briefings"
        description="Evidence-backed narrative briefings synthesized from Command Center intelligence — not a dashboard."
        actions={
          <Link
            href="/jag"
            className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            Overview
          </Link>
        }
      >
        <JagBriefingGenerateForm
          organizations={model.organizations}
          defaultOrganizationId={model.selectedOrganizationId}
        />
      </JagSection>

      <JagSection
        title="Generated briefings"
        description={
          model.selectedOrganizationId
            ? "Briefings for the selected organization scope."
            : "Generate a briefing to begin the archive."
        }
      >
        {model.briefings.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--jag-border)] bg-[var(--jag-panel)] px-4 py-8 text-sm text-[var(--jag-muted)]">
            No briefings have been generated yet. Choose an organization and
            timeline, then synthesize. Empty sections in a briefing mean those
            sources are unbound — nothing is invented.
          </div>
        ) : (
          <ul className="space-y-2">
            {model.briefings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/jag/briefings/${b.id}`}
                  className="block rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-3 transition-colors hover:border-[var(--jag-border-strong)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--jag-text)]">
                        {b.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--jag-muted)]">
                        {b.organizationName} · {b.windowLabel}
                      </p>
                    </div>
                    <div className="shrink-0 text-right font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
                      <p>
                        {b.overallConfidence === null
                          ? "—"
                          : b.overallConfidence.toFixed(2)}
                      </p>
                      <p className="mt-0.5">
                        {b.hasSubstance ? "ready" : "sparse"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {b.generatedAt}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </JagSection>
    </div>
  );
}
