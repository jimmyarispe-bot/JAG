"use client";

import { useState, type ReactNode } from "react";
import { LeftNav } from "./LeftNav";
import { MainContent } from "./MainContent";
import { InsightPanel } from "./InsightPanel";
import { cn } from "../utils";

export interface WorkspaceLayoutProps {
  leftNav?: ReactNode;
  leftNavTitle?: string;
  main: ReactNode;
  insightPanel?: ReactNode;
  insightTitle?: string;
  className?: string;
}

export function WorkspaceLayout({
  leftNav,
  leftNavTitle,
  main,
  insightPanel,
  insightTitle,
  className,
}: WorkspaceLayoutProps) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {leftNav && (
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            Menu
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {leftNav && (
          <LeftNav title={leftNavTitle} mobileOpen={navOpen} onMobileClose={() => setNavOpen(false)}>
            {leftNav}
          </LeftNav>
        )}
        <MainContent>{main}</MainContent>
        {insightPanel && <InsightPanel title={insightTitle}>{insightPanel}</InsightPanel>}
      </div>
    </div>
  );
}
