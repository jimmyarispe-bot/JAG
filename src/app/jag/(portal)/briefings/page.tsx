import Link from "next/link";
import { redirect } from "next/navigation";
import { JagSection, JagStatusBadge } from "@/components/jag/command-center";
import {
  getStoredExecutiveBrief,
  listLoadedDomains,
} from "@/lib/jag-command-center";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagBriefingsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;
  const organizations = listOrganizationsForSession(session);
  const organization =
    organizations.find((o) => o.id === params.org) ?? organizations[0] ?? null;
  const brief = organization
    ? getStoredExecutiveBrief(organization.id)
    : null;
  const domains = listLoadedDomains();

  return (
    <JagSection
      title="Executive Briefings"
      description="Leadership briefs from Education Executive Intelligence (TOP_LEVEL_SYNTHESIS)."
      actions={
        <Link
          href="/jag"
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Overview
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-[var(--jag-muted)]">
        {domains.map((d) => (
          <span
            key={d.id}
            className="rounded border border-[var(--jag-border)] px-2 py-1"
          >
            {d.name}
          </span>
        ))}
      </div>

      <div className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--jag-muted)]">
            {organization
              ? organization.name
              : "No organization selected"}
          </p>
          <JagStatusBadge status={brief ? "ready" : "empty"} />
        </div>

        {!brief ? (
          <div className="space-y-3 text-sm leading-relaxed text-[var(--jag-muted)]">
            <p>No Executive Education Brief is bound for this organization.</p>
            <p>How briefs are generated:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Plan an executive intent (Executive Brief, Board Review,
                Quarterly Review, Annual Planning, Strategic Review, or Network
                Health).
              </li>
              <li>
                Run the Education Intelligence Orchestrator so School Health and
                Campus Performance (plus readiness contributors) execute.
              </li>
              <li>
                Bind the resulting execution snapshot via{" "}
                <code className="font-[family-name:var(--font-jag-mono)] text-[11px]">
                  recordEducationExecutionSnapshot
                </code>{" "}
                — the overview and this page will show the latest brief.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--jag-muted)]">
              Stance · {brief.stance} · Confidence ·{" "}
              {brief.confidence.toFixed(2)} · {brief.capturedAt}
            </p>
            <p className="text-sm leading-relaxed text-[var(--jag-text)]">
              {brief.summary}
            </p>
            {brief.strategicPriorities.length > 0 ? (
              <List label="Strategic priorities" items={brief.strategicPriorities} />
            ) : null}
            {brief.criticalRisks.length > 0 ? (
              <List label="Critical risks" items={brief.criticalRisks} />
            ) : null}
            {brief.recommendedActions.length > 0 ? (
              <List
                label="Recommended actions"
                items={brief.recommendedActions}
              />
            ) : null}
          </div>
        )}
      </div>
    </JagSection>
  );
}

function List({
  label,
  items,
}: {
  label: string;
  items: readonly string[];
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--jag-muted)]">
        {label}
      </p>
      <ul className="mt-1 space-y-1 text-sm text-[var(--jag-text)]">
        {items.map((item) => (
          <li key={item}>– {item}</li>
        ))}
      </ul>
    </div>
  );
}
