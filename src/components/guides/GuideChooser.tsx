"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "@/components/experience-system/interaction";
import { GUIDE_AREAS, searchGuides, type Guide } from "@/lib/guides/catalog";
import { useGuide } from "./GuideProvider";

/**
 * "What do you want to work on?"
 *
 * The first thing a person sees when they sign in. Pick an area, then the thing
 * they are actually trying to do; the checklist then stays with them while they
 * do it.
 *
 * WHY AREAS FIRST AND NOT A FLAT LIST
 *
 * Fifty walkthroughs in one list is a menu nobody reads — it asks somebody to
 * scan fifty sentences before they know which one is theirs. The areas are the
 * sidebar, in the order they already see it, because somebody told "it's under
 * Admissions" should find an area called Admissions.
 *
 * AND WHY THERE IS A SEARCH BOX ANYWAY
 *
 * Two clicks only helps a person who knows which door their task is behind. The
 * ones who do not are exactly who this screen is for, and they will type the
 * word they actually have — "shadow day", "refund", "transcript" — which may
 * sit under an area they would never have opened. Typing searches every
 * walkthrough at once and says which area each answer came from, so the search
 * teaches the map instead of replacing it.
 *
 * THE WAY OUT IS A BUTTON, NOT A HABIT
 *
 * "I can find my way around JAG" stops this opening by itself, permanently. It
 * is written plainly and sits with the other actions rather than hiding, because
 * a person who cannot find the off switch on something that greets them every
 * morning stops trusting everything else on the screen. It does not delete
 * anything: the launcher stays, and the walkthroughs are one click away for the
 * day they hit something they have not done before.
 */
export function GuideChooser() {
  const guide = useGuide();
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = guide?.chooserOpen ?? false;
  useFocusTrap(open, dialogRef);
  const titleId = useId();
  const searchId = useId();
  const [areaId, setAreaId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape steps back one level before it closes — somebody who searched or
      // picked the wrong area wants the area list, not to start over.
      if (query) setQuery("");
      else if (areaId) setAreaId(null);
      else guide?.closeChooser();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, areaId, query, guide]);

  const matches = useMemo(() => searchGuides(query), [query]);

  if (!guide || !open || typeof document === "undefined") return null;

  const searching = query.trim().length > 0;
  const area = areaId ? GUIDE_AREAS.find((a) => a.id === areaId) ?? null : null;
  const totalGuides = GUIDE_AREAS.reduce((n, a) => n + a.guides.length, 0);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) guide.closeChooser();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-semibold text-slate-900">
                {searching
                  ? "What do you want to work on?"
                  : area
                    ? area.label
                    : "What do you want to work on?"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {searching
                  ? `${matches.length} of ${totalGuides} walkthroughs match "${query.trim()}"`
                  : area
                    ? area.blurb
                    : "Say what you are trying to do and JAG will give you the steps, with a link at each one."}
              </p>
            </div>
            <button
              type="button"
              onClick={guide.closeChooser}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Not now
            </button>
          </div>

          <div className="mt-4">
            <label htmlFor={searchId} className="sr-only">
              Search walkthroughs
            </label>
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — shadow day, attendance, invoice, transcript…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {searching && (
            <div className="space-y-2">
              {matches.map(({ area: a, guide: g }) => (
                <GuideButton
                  key={g.id}
                  guide={g}
                  areaLabel={a.label}
                  onStart={() => guide.startGuide(g.id)}
                />
              ))}
              {matches.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  Nothing matches that word. Clear the box to see all{" "}
                  {GUIDE_AREAS.length} areas.
                </p>
              )}
            </div>
          )}

          {!searching && !area && (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDE_AREAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAreaId(a.id)}
                  className="rounded-xl border border-slate-200 p-3 text-left hover:border-brand-400 hover:bg-brand-50"
                >
                  <span className="block font-medium text-slate-900">{a.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{a.blurb}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {a.guides.length}{" "}
                    {a.guides.length === 1 ? "walkthrough" : "walkthroughs"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!searching && area && (
            <>
              <div className="space-y-2">
                {area.guides.map((g) => (
                  <GuideButton
                    key={g.id}
                    guide={g}
                    onStart={() => guide.startGuide(g.id)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAreaId(null)}
                className="mt-4 text-sm text-slate-600 underline underline-offset-2"
              >
                ← All areas
              </button>
            </>
          )}
        </div>

        {/*
          * The off switch, and the way back on.
          *
          * Once dismissed this footer stops offering to stop — there is nothing
          * left to turn off — and offers the reverse instead, because the only
          * person who reaches this screen after dismissing it opened it on
          * purpose, and may well want the morning prompt back.
          */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            {guide.dismissed
              ? "This no longer opens by itself — you opened it."
              : "This opens once each time you sign in."}
          </p>
          {guide.dismissed ? (
            <button
              type="button"
              onClick={guide.undismiss}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Ask me again when I sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={guide.dismiss}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              I can find my way around JAG — stop opening this
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function GuideButton({
  guide,
  areaLabel,
  onStart,
}: {
  guide: Guide;
  areaLabel?: string;
  onStart: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="block w-full rounded-xl border border-slate-200 p-3 text-left hover:border-brand-400 hover:bg-brand-50"
    >
      {areaLabel && (
        <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
          {areaLabel}
        </span>
      )}
      <span className="block font-medium text-slate-900">{guide.title}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{guide.summary}</span>
      <span className="mt-1 block text-xs text-slate-400">
        {guide.steps.length} steps
      </span>
    </button>
  );
}
