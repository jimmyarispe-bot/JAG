import Link from "next/link";
import { JagMetric } from "./JagMetric";
import { JagStatusBadge } from "./JagStatusBadge";
import type { JagOverviewCardModel } from "./types";

export function JagCard({ card }: { readonly card: JagOverviewCardModel }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium tracking-tight text-[var(--jag-text)]">
          {card.title}
        </h3>
        <JagStatusBadge status={card.status} />
      </div>

      {card.status === "loading" ? (
        <div className="mt-4 space-y-2" aria-hidden>
          <div className="h-3 w-[75%] animate-pulse rounded bg-[var(--jag-panel-2)]" />
          <div className="h-8 w-[33%] animate-pulse rounded bg-[var(--jag-panel-2)]" />
        </div>
      ) : null}

      {card.status === "empty" ? (
        <p className="mt-3 text-sm leading-relaxed text-[var(--jag-muted)]">
          {card.summary}
        </p>
      ) : null}

      {card.status === "ready" ? (
        <div className="mt-3 space-y-3">
          {card.metricLabel && card.metricValue ? (
            <JagMetric label={card.metricLabel} value={card.metricValue} />
          ) : null}
          <p className="text-sm leading-relaxed text-[var(--jag-muted)]">
            {card.summary}
          </p>
          {card.detail ? (
            <p className="text-xs leading-relaxed text-[var(--jag-muted-2)]">
              {card.detail}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  const className =
    "block h-full rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 transition-colors hover:border-[var(--jag-border-strong)]";

  if (card.href) {
    return (
      <Link href={card.href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
