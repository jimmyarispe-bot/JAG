"use client";

import { useEffect, useState } from "react";
import { recordHydrationMark } from "@/lib/performance/actions";

/**
 * Client island — measures approximate hydration / interactive time for this page.
 * Does not change application behavior.
 */
export function PerformanceHydrationMeter({ route }: { route: string }) {
  const [hydrationMs, setHydrationMs] = useState<number | null>(null);
  const [navMs, setNavMs] = useState<number | null>(null);

  useEffect(() => {
    const started = performance.now();
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    // Yield to allow React commit/hydration to settle
    const id = requestAnimationFrame(() => {
      const ms = Math.round((performance.now() - started) * 100) / 100;
      setHydrationMs(ms);
      const transfer = nav
        ? Math.round((nav.responseEnd - nav.requestStart) * 100) / 100
        : null;
      setNavMs(transfer);
      void recordHydrationMark(route, ms);
    });

    return () => cancelAnimationFrame(id);
  }, [route]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Client hydration (this page)
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-slate-500">Hydration settle</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {hydrationMs == null ? "…" : `${hydrationMs} ms`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Nav request→response</dt>
          <dd className="text-lg font-semibold text-slate-900">
            {navMs == null ? "…" : `${navMs} ms`}
          </dd>
        </div>
      </dl>
    </div>
  );
}
