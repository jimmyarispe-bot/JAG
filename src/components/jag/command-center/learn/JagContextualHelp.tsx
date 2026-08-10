"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  pageIdForPathname,
  tutorialForPageId,
} from "@/lib/jag-command-center/learning/client";

/**
 * Subtle Learn/Help affordance — does not clutter the Command Center.
 */
export function JagContextualHelp() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/jag/learn") || pathname.startsWith("/jag/login")) {
    return null;
  }

  const pageId = pageIdForPathname(pathname);
  const tutorial = pageId ? tutorialForPageId(pageId) : null;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {open ? (
        <div className="mb-2 w-56 rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] p-3 shadow-lg">
          <p className="text-xs font-medium text-[var(--jag-text)]">Learn</p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {tutorial ? (
              <li>
                <Link
                  href={`/jag/learn/tutorials/${tutorial.slug}`}
                  className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                  onClick={() => setOpen(false)}
                >
                  Learn this page
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/jag/learn/help"
                className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                onClick={() => setOpen(false)}
              >
                What is this?
              </Link>
            </li>
            {tutorial ? (
              <li>
                <Link
                  href={`/jag/learn/tutorials/${tutorial.slug}`}
                  className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                  onClick={() => setOpen(false)}
                >
                  Open tutorial
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/jag/learn/coach"
                className="text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
                onClick={() => setOpen(false)}
              >
                Ask JAG Coach
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
      <button
        type="button"
        className="rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2.5 py-1.5 text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
        aria-expanded={open}
        aria-label={open ? "Close learn menu" : "Open learn menu"}
        onClick={() => setOpen((v) => !v)}
      >
        Learn
      </button>
    </div>
  );
}
