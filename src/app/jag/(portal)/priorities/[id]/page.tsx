import Link from "next/link";
import { redirect } from "next/navigation";
import { JagSection } from "@/components/jag/command-center";
import { getDecisionDetail } from "@/lib/executive-intelligence";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagPriorityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const { id } = await params;
  const query = await searchParams;
  const organizations = listOrganizationsForSession(session);
  const organization =
    organizations.find((o) => o.id === query.org) ?? organizations[0] ?? null;

  if (!organization) {
    return (
      <JagSection title="Priority" description="No organization available.">
        <Empty message="Select or provision an organization to view priority detail." />
      </JagSection>
    );
  }

  const detail = getDecisionDetail(organization.id, id);
  if (!detail) {
    return (
      <JagSection title="Priority" description="Decision not found.">
        <Empty message="This priority is not recorded for the selected organization." />
        <Link
          href="/jag"
          className="mt-4 inline-block text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Back to overview
        </Link>
      </JagSection>
    );
  }

  const { decision, timeline } = detail;

  return (
    <JagSection
      title={decision.title}
      description={`${decision.priority} · ${decision.severity} · ${decision.status}`}
      actions={
        <Link
          href="/jag"
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Overview
        </Link>
      }
    >
      <div className="space-y-4 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
        <p className="text-sm leading-relaxed text-[var(--jag-text)]">
          {decision.description}
        </p>
        <dl className="grid gap-3 sm:grid-cols-2 text-xs">
          <Field label="Recommended decision" value={decision.recommendedProcess} />
          <Field label="Category" value={decision.category} />
          <Field label="Source" value={decision.source} />
          <Field label="Trigger" value={decision.trigger} />
          <Field
            label="Evidence"
            value={String(decision.relatedEvidenceIds.length)}
          />
          <Field
            label="Related insights"
            value={String(decision.relatedInsightIds.length)}
          />
        </dl>
        {timeline.length > 0 ? (
          <div>
            <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--jag-muted)]">
              Timeline
            </p>
            <ul className="mt-2 space-y-2">
              {timeline.slice(0, 12).map((entry) => (
                <li
                  key={entry.id}
                  className="border-t border-[var(--jag-border)] pt-2 text-xs text-[var(--jag-muted)]"
                >
                  <span className="font-[family-name:var(--font-jag-mono)] text-[var(--jag-muted-2)]">
                    {entry.at}
                  </span>
                  {" · "}
                  {entry.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </JagSection>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--jag-muted-2)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--jag-text)]">{value}</dd>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-[var(--jag-border)] px-4 py-8 text-sm text-[var(--jag-muted)]">
      {message}
    </div>
  );
}
