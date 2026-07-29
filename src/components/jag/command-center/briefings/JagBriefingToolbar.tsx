"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createBriefingShareLink,
  createFollowUpBriefing,
  scheduleBriefingFollowUpReview,
} from "@/lib/jag-command-center/briefing-engine/actions";
import { JAG_BRIEFING_KIND_LABELS } from "@/lib/jag-command-center/briefing-engine/kinds";
import {
  JAG_BRIEFING_KINDS,
  type JagBriefingKind,
} from "@/lib/jag-command-center/briefing-engine/types";

export type BriefingViewMode = "standard" | "print" | "board";

export function JagBriefingToolbar({
  briefingId,
  shareToken,
  mode,
  readOnly,
}: {
  readonly briefingId: string;
  readonly shareToken: string | null;
  readonly mode: BriefingViewMode;
  readonly readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followUpKind, setFollowUpKind] =
    useState<JagBriefingKind>("weekly_executive_review");
  const [reviewAt, setReviewAt] = useState("");

  function setMode(next: BriefingViewMode) {
    const url = new URL(window.location.href);
    if (next === "standard") url.searchParams.delete("mode");
    else url.searchParams.set("mode", next);
    router.push(`${url.pathname}${url.search}`);
  }

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        <ModeButton active={mode === "standard"} onClick={() => setMode("standard")}>
          Standard
        </ModeButton>
        <ModeButton active={mode === "print"} onClick={() => setMode("print")}>
          Print / PDF
        </ModeButton>
        <ModeButton active={mode === "board"} onClick={() => setMode("board")}>
          Board mode
        </ModeButton>
        <button
          type="button"
          onClick={() => window.print()}
          className={btnClass}
        >
          Print
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <ModeButton active={mode === "standard"} onClick={() => setMode("standard")}>
          Standard
        </ModeButton>
        <ModeButton active={mode === "print"} onClick={() => setMode("print")}>
          Print-friendly
        </ModeButton>
        <ModeButton active={mode === "board"} onClick={() => setMode("board")}>
          Board presentation
        </ModeButton>
        <button
          type="button"
          onClick={() => window.print()}
          className={btnClass}
        >
          Print / PDF export
        </button>
        <button
          type="button"
          disabled={pending}
          className={btnClass}
          onClick={() => {
            setError(null);
            setMessage(null);
            startTransition(async () => {
              const result = await createBriefingShareLink({ briefingId });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              const absolute = `${window.location.origin}${result.sharePath}`;
              try {
                await navigator.clipboard.writeText(absolute);
                setMessage(`Share link copied: ${result.sharePath}`);
              } catch {
                setMessage(`Share link: ${result.sharePath}`);
              }
              router.refresh();
            });
          }}
        >
          {shareToken ? "Copy share link" : "Create read-only share link"}
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Create follow-up
          </span>
          <select
            value={followUpKind}
            onChange={(e) =>
              setFollowUpKind(e.target.value as JagBriefingKind)
            }
            className={fieldClass}
          >
            {JAG_BRIEFING_KINDS.map((k) => (
              <option key={k} value={k}>
                {JAG_BRIEFING_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          className={btnClass}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await createFollowUpBriefing({
                sourceBriefingId: briefingId,
                kind: followUpKind,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push(`/jag/briefings/${result.briefingId}`);
            });
          }}
        >
          Create follow-up
        </button>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            Schedule review
          </span>
          <input
            type="date"
            value={reviewAt}
            onChange={(e) => setReviewAt(e.target.value)}
            className={fieldClass}
          />
        </label>
        <button
          type="button"
          disabled={pending || !reviewAt}
          className={btnClass}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await scheduleBriefingFollowUpReview({
                briefingId,
                at: reviewAt,
                note: "Scheduled from briefing toolbar",
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setMessage("Review scheduled.");
              router.refresh();
            });
          }}
        >
          Schedule review
        </button>
      </div>

      <p className="text-[11px] text-[var(--jag-muted-2)]">
        Email delivery integration is reserved for a future release (application
        metadata only today).
      </p>
      {message ? (
        <p className="text-xs text-[var(--jag-text)]">{message}</p>
      ) : null}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded border border-[var(--jag-border-strong)] bg-[var(--jag-panel-2)] px-2.5 py-1 text-[var(--jag-text)]"
          : btnClass
      }
    >
      {children}
    </button>
  );
}

const btnClass =
  "rounded border border-[var(--jag-border)] px-2.5 py-1 text-[var(--jag-muted)] hover:text-[var(--jag-text)] disabled:opacity-50";
const fieldClass =
  "mt-1 block rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] px-2 py-1.5 text-xs text-[var(--jag-text)]";
