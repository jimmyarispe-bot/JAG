"use client";

import Link from "next/link";
import { useState } from "react";
import { areaOfGuide } from "@/lib/guides/catalog";
import { useGuide } from "./GuideProvider";

/**
 * The checklist that stays.
 *
 * Docked bottom-right, above the page, while somebody does the actual work.
 * Following step one must not close the thing that told them to — which is the
 * single reason this lives in a provider rather than on a page.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not dim the screen, block clicks, or point at a specific button. A
 * highlighted tour is pinned to CSS selectors and silently lands on nothing the
 * first time a layout changes — and nobody finds out until a school leader is
 * mid-conversation with a parent. Links to pages are a far more stable promise,
 * and when a page does move the link fails loudly.
 *
 * It also does not force an order. Somebody who already knows step one ticks it
 * and moves on; a checklist that refuses to let you skip is a checklist people
 * stop opening.
 */
export function GuidePanel() {
  const guide = useGuide();
  const [collapsed, setCollapsed] = useState(false);

  if (!guide) return null;

  /**
   * No guide running — the way back in.
   *
   * The way IN is the chooser, which now opens itself, front and centre, once
   * each time somebody signs in. This button is what remains afterwards: for
   * the person who closed it this morning and then hit something they have not
   * done before, and for the person who pressed "I can find my way around JAG"
   * in March and needs a walkthrough in October.
   *
   * It stays on screen rather than going into a menu for the reason the People
   * directory taught us last week: a filter system nobody could find cost the
   * same as one nobody had built.
   */
  if (!guide.guide) {
    return (
      <button
        type="button"
        onClick={guide.openChooser}
        className="fixed bottom-4 right-4 z-40 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-lg hover:bg-slate-50"
      >
        I want to work on…
      </button>
    );
  }

  const { guide: active, doneSteps, toggleStep, closeGuide } = guide;
  const area = areaOfGuide(active.id);
  const done = active.steps.filter((_, i) => doneSteps.has(i)).length;
  const complete = done === active.steps.length;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-40 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-lg hover:bg-slate-50"
      >
        {active.title} — {done}/{active.steps.length}
      </button>
    );
  }

  return (
    <aside
      aria-label="Walkthrough"
      className="fixed bottom-4 right-4 z-40 flex max-h-[70vh] w-[22rem] flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 p-3">
        <div>
          {area && (
            <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              {area.label}
            </span>
          )}
          <h2 className="text-sm font-semibold text-slate-900">{active.title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {done} of {active.steps.length} done
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            aria-label="Collapse walkthrough"
          >
            —
          </button>
          <button
            type="button"
            onClick={closeGuide}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>

      <ol className="flex-1 overflow-y-auto p-3">
        {active.steps.map((step, index) => {
          const isDone = doneSteps.has(index);
          return (
            <li key={`${active.id}-${index}`} className="mb-3 last:mb-0">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleStep(index)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
                  aria-label={`Step ${index + 1}: ${step.title}`}
                />
                <div className="min-w-0">
                  <p
                    className={`text-sm ${
                      isDone ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    <span className="font-medium">{index + 1}.</span> {step.title}
                  </p>
                  {step.detail && (
                    <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
                  )}
                  {step.href && (
                    /*
                     * Following the link does NOT tick the step. Arriving on a
                     * page is not the same as having done the thing, and a
                     * checklist that ticks itself is a checklist that lies
                     * about what happened.
                     */
                    <Link
                      href={step.href}
                      className="mt-1 inline-block text-xs font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
                    >
                      Take me there →
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {complete && (
        <div className="border-t border-slate-200 p-3">
          <p className="text-xs text-emerald-700">
            All {active.steps.length} steps ticked.
          </p>
          <button
            type="button"
            onClick={closeGuide}
            className="mt-2 w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white"
          >
            Done
          </button>
        </div>
      )}
    </aside>
  );
}
