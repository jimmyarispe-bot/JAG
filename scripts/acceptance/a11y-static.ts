/**
 * RC-4 — static accessibility spot-check on key shell components (source heuristics).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type A11yFinding = {
  id: string;
  severity: "blocker" | "high" | "medium" | "low" | "info";
  area: string;
  message: string;
  path?: string;
};

const ROOT = process.cwd();

function read(rel: string): string | null {
  const full = join(ROOT, rel);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

export function runStaticA11yReview(): A11yFinding[] {
  const findings: A11yFinding[] = [];

  const checks: Array<{ file: string; need: RegExp; id: string; ok: string; bad: string }> = [
    {
      file: "src/components/portal/PortalShell.tsx",
      need: /portal-main|skip/i,
      id: "a11y.portal.skip",
      ok: "Portal skip link / main landmark present",
      bad: "Portal shell missing skip/main landmark pattern",
    },
    {
      file: "src/components/dashboard/DashboardChrome.tsx",
      need: /skip|main/i,
      id: "a11y.dashboard.skip",
      ok: "Dashboard chrome has skip/main pattern",
      bad: "Dashboard chrome missing skip/main pattern",
    },
    {
      file: "src/components/exec/ExecShell.tsx",
      need: /skip|main/i,
      id: "a11y.exec.skip",
      ok: "Exec shell has skip/main pattern",
      bad: "Exec shell missing skip/main pattern",
    },
    {
      file: "src/app/login/LoginForm.tsx",
      need: /getByLabel|htmlFor|aria-|label/i,
      id: "a11y.login.labels",
      ok: "Login form uses labels / a11y attributes",
      bad: "Login form missing label patterns",
    },
    {
      file: "src/components/experience-system/feedback/LiveAnnouncer.tsx",
      need: /aria-live|LiveAnnouncer/i,
      id: "a11y.live.announcer",
      ok: "Live announcer present for async feedback",
      bad: "Live announcer missing",
    },
    {
      file: "src/components/portal/PortalAccessibilityBar.tsx",
      need: /contrast|motion|text/i,
      id: "a11y.portal.bar",
      ok: "Portal accessibility preferences bar present",
      bad: "Portal accessibility bar missing",
    },
  ];

  for (const c of checks) {
    const src = read(c.file);
    if (!src) {
      findings.push({
        id: c.id,
        severity: "medium",
        area: "accessibility",
        message: `File not found: ${c.file}`,
        path: c.file,
      });
      continue;
    }
    if (c.need.test(src)) {
      findings.push({
        id: c.id,
        severity: "info",
        area: "accessibility",
        message: c.ok,
        path: c.file,
      });
    } else {
      findings.push({
        id: c.id,
        severity: "medium",
        area: "accessibility",
        message: c.bad,
        path: c.file,
      });
    }
  }

  // Staff shells lack portal a11y bar — known UX gap (not blocker).
  findings.push({
    id: "a11y.staff.bar.gap",
    severity: "low",
    area: "accessibility",
    message:
      "PortalAccessibilityBar is portal-only; staff/exec shells rely on OS/browser preferences (documented UX observation)",
  });

  // No axe CI — known defect E-007 / G-RC1-06
  findings.push({
    id: "a11y.axe.ci",
    severity: "high",
    area: "accessibility",
    message:
      "No automated axe/pa11y CI gate (E-007 / G-RC1-06). Login smoke covers labels only.",
  });

  return findings;
}
