import Link from "next/link";
import { redirect } from "next/navigation";
import {
  JagEmptyState,
  JagSection,
  JagStatusBadge,
} from "@/components/jag/command-center";
import { listJagAuditEvents } from "@/lib/jag-command-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

/**
 * Observability surfaces executive audit events from Command Center actions.
 * No new intelligence — application audit trail only.
 */
export default async function JagObservabilityPage() {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const events = listJagAuditEvents(40);

  return (
    <JagSection
      title="Observability"
      description="Executive action audit trail for the Command Center. No stack traces. No fabricated telemetry."
      actions={
        <Link
          href="/jag"
          className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        >
          Overview
        </Link>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--jag-muted)]">
          Timestamp · Organization · User · Decision · Action
        </p>
        <JagStatusBadge status={events.length > 0 ? "ready" : "empty"} />
      </div>

      {events.length === 0 ? (
        <JagEmptyState
          title="No audit events yet"
          description="Approve, assign, complete, or generate a briefing to populate the executive audit trail."
        />
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs text-[var(--jag-muted)]"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                  {e.at}
                </p>
                <p className="text-[var(--jag-text)]">
                  {e.action.replace(/_/g, " ")}
                </p>
              </div>
              <p className="mt-1 text-[var(--jag-text)]">{e.detail}</p>
              <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[10px]">
                user {e.actorLabel}
                {e.organizationId ? ` · org ${e.organizationId}` : ""}
                {e.decisionId ? ` · decision ${e.decisionId.slice(0, 12)}` : ""}
                {e.briefingId ? ` · briefing ${e.briefingId.slice(0, 12)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </JagSection>
  );
}
