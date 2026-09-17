"use client";

import { useState } from "react";
import type { PublicInquiryLinks } from "@/lib/admissions/public-form-links";

/**
 * The address parents use, on the screen staff actually open.
 *
 * The point is copy-and-paste, not navigation — there was already a link that
 * opened the form, and it answered the wrong question. What nobody could find
 * was the URL to hand to a website, a flyer, or a parent on the phone.
 *
 * Client-side only for the clipboard. Every URL is also a real anchor, so the
 * panel still works if the copy button is unavailable — a sandboxed iframe, an
 * insecure origin, or a browser that refuses clipboard access.
 */
export function PublicInquiryLinkPanel({ links }: { links: PublicInquiryLinks }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied((c) => (c === url ? null : c)), 2000);
    } catch {
      // Clipboard refused. The anchor beside it still works, so say nothing
      // rather than throw an error at somebody who can right-click and copy.
      setCopied(null);
    }
  }

  /*
     ONE ADDRESS.
     
     This listed every host mapped to the organization - five rows, one of them
     a duplicate, all serving the identical form. The intent was honesty about
     what resolves; the effect was a wall of near-identical URLs and no answer
     to "which one do I put on the website?". public-form-links ranks the org's
     own door on the platform domain first, because that one is served directly
     and always resolves. The rest are real and still work; they are simply not
     the answer to the question being asked.
  */
  const primary = links.urls[0] ?? null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Parent inquiry link</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Put this on the school websites. Families who submit it land in JAG automatically.
      </p>

      {links.unavailable ? (
        /* The reason, never a blank box. A panel that renders nothing when the
           mapping is missing repeats the exact failure it exists to surface. */
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {links.unavailable}
        </div>
      ) : null}

      {primary ? (
        <div className="mt-3 space-y-2">
          <code className="block w-full break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
            {primary}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copy(primary)}
              className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
            >
              {copied === primary ? "Copied" : "Copy"}
            </button>
            <a
              href={primary}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Open
            </a>
          </div>
        </div>
      ) : null}

      {links.campuses.length ? (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          <span className="font-medium text-slate-700">Campuses a parent can choose:</span>{" "}
          {links.campuses.map((c) => c.name).join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
