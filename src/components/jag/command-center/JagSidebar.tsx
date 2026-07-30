"use client";

import Link from "next/link";
import { useState } from "react";
import type { OrganizationBrand } from "@/lib/platform/branding";
import { POWERED_BY_LINE } from "@/lib/platform/branding";
import { JagBrandLogoMark } from "./branding/JagBrandChrome";
import { isJagNavActive, JAG_COMMAND_NAV } from "./nav";

export function JagSidebar({
  pathname,
  brand,
  pageTitle,
}: {
  readonly pathname: string;
  readonly brand: OrganizationBrand;
  readonly pageTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2.5 py-1.5 text-xs text-[var(--jag-text)] focus-visible:border-[var(--jag-border-strong)] md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="jag-command-nav"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
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
          <JagBrandLogoMark brand={brand} dark className="h-8 max-w-[11rem] object-contain" />
          <p className="mt-2 text-[11px] leading-snug text-[var(--jag-muted)]">
            {pageTitle}
          </p>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 py-3"
          aria-label={`${brand.display_name} navigation`}
        >
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

        <div className="border-t border-[var(--jag-border)] px-4 py-3">
          {brand.powered_by_enabled ? (
            <p className="text-[10px] text-[var(--jag-muted)]">{POWERED_BY_LINE}</p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
