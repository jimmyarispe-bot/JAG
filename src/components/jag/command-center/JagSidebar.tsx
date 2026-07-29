"use client";

import Link from "next/link";
import { useState } from "react";
import { isJagNavActive, JAG_COMMAND_NAV } from "./nav";

export function JagSidebar({ pathname }: { readonly pathname: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2.5 py-1.5 text-xs text-[var(--jag-text)] md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="jag-command-nav"
      >
        Menu
      </button>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="jag-command-nav"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-[var(--jag-border)] bg-[var(--jag-bg)] transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-[var(--jag-border)] px-4 py-5">
          <p className="font-[family-name:var(--font-jag-display)] text-xl font-semibold tracking-tight text-[var(--jag-text)]">
            JAG
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[var(--jag-muted)]">
            Executive Command Center
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="JAG">
          <ul className="space-y-0.5">
            {JAG_COMMAND_NAV.map((item) => {
              const active = isJagNavActive(pathname, item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      active
                        ? "block rounded px-3 py-2 text-[13px] font-medium text-[var(--jag-text)] bg-[var(--jag-panel-2)]"
                        : "block rounded px-3 py-2 text-[13px] text-[var(--jag-muted)] hover:bg-[var(--jag-panel)] hover:text-[var(--jag-text)]"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
