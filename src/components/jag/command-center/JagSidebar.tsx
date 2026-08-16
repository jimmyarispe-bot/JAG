"use client";

import Link from "next/link";
import { useState } from "react";
import type { OrganizationBrand } from "@/lib/platform/branding";
import { POWERED_BY_LINE, THE_JAG_MARK } from "@/lib/platform/branding";
import {
  customerWorkspaceHref,
  platformAdminHref,
  type JagWorkspaceMode,
} from "@/lib/jag-platform/workspace-mode";
import { JagBrandLogoMark } from "./branding/JagBrandChrome";
import { isJagNavActive, type JagNavItem } from "./nav";

export function JagSidebar({
  pathname,
  brand,
  pageTitle,
  navItems,
  workspaceMode,
  activeOrganizationId,
  activeOrganizationLabel = null,
  canEnterPlatformAdmin,
}: {
  readonly pathname: string;
  readonly brand: OrganizationBrand;
  readonly pageTitle: string;
  readonly navItems: readonly JagNavItem[];
  readonly workspaceMode: JagWorkspaceMode;
  readonly activeOrganizationId: string | null;
  readonly activeOrganizationLabel?: string | null;
  readonly canEnterPlatformAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const organizationTitle =
    activeOrganizationLabel?.trim() || brand.display_name;
  const sidebarTitle =
    workspaceMode === "platform" ? THE_JAG_MARK : organizationTitle;

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
          <p className="mt-2 text-sm font-medium leading-snug text-[var(--jag-text)]">
            {sidebarTitle}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--jag-muted)]">
            {workspaceMode === "customer"
              ? "Executive Intelligence · The JAG™"
              : "The JAG™ Platform Admin"}
          </p>
          <p className="sr-only">{pageTitle}</p>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-2 py-3"
          aria-label={`${organizationTitle} navigation`}
        >
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = isJagNavActive(pathname, item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    data-jag-nav={item.id}
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

        <div className="border-t border-[var(--jag-border)] px-4 py-3 space-y-2">
          {canEnterPlatformAdmin && workspaceMode === "customer" ? (
            <Link
              href={platformAdminHref()}
              onClick={() => setOpen(false)}
              className="block text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Open platform admin
            </Link>
          ) : null}
          {canEnterPlatformAdmin &&
          workspaceMode === "platform" &&
          activeOrganizationId ? (
            <Link
              href={customerWorkspaceHref(activeOrganizationId)}
              onClick={() => setOpen(false)}
              className="block text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
            >
              Back to organization
            </Link>
          ) : null}
          {brand.powered_by_enabled ? (
            <p className="text-[10px] text-[var(--jag-muted)]">{POWERED_BY_LINE}</p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
