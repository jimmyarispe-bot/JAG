/**
 * Sprint 008 — Financial Security.
 *
 * Only identities with FINANCE_ACCESS may access:
 * Accounting, Payroll, Banking, P&L, Cash Flow, Budgets,
 * Forecasting, and Financial Intelligence.
 *
 * Every finance route uses centralized authorization
 * (authorize() / hasPermission()) — never role-name checks.
 */

import {
  authorize,
  hasPermission,
  toAuthzSnapshot,
  type AuthzSnapshot,
  type AuthzSubject,
} from "@/lib/platform/identity/authorization-service";
import { ACADEMYOS_HOME_PATH } from "@/lib/platform/identity/founder-protection";

/** Catalog gate for all financial security surfaces. */
export const FINANCE_ENTRY_PERMISSION = "FINANCE_ACCESS" as const;

/** Redirect when financial access is denied. */
export const FINANCE_DENIED_REDIRECT = ACADEMYOS_HOME_PATH;

/** Query/view values that identify protected finance surfaces. */
const FINANCE_VIEW_KEYS = new Set([
  "accounting",
  "payroll",
  "banking",
  "pnl",
  "p&l",
  "p-and-l",
  "profit-and-loss",
  "cashflow",
  "cash-flow",
  "cash_flow",
  "budgets",
  "budget",
  "forecast",
  "forecasting",
  "intelligence",
  "financial-intelligence",
]);

/** Path segments / substrings that identify protected finance surfaces. */
const FINANCE_PATH_MARKERS = [
  "/dashboard/finance",
  "/dashboard/admin/finance",
  "/dashboard/network/finance",
  "/dashboard/finance/intelligence",
  "/dashboard/finance/executive",
  "/accounting",
  "/banking",
  "/payroll",
  "/budgets",
  "/budget",
  "/forecasting",
  "/forecast",
  "/cash-flow",
  "/cashflow",
  "/cash_flow",
  "/pnl",
  "/p-and-l",
  "/financial-intelligence",
] as const;

function normalizePath(pathname: string): string {
  return pathname.toLowerCase();
}

function financeViewFromSearch(search: string = ""): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const view = (params.get("view") ?? params.get("tab") ?? "").toLowerCase().trim();
  return view || null;
}

/** True when the path/search targets a Sprint 008 financial security surface. */
export function isFinancialSecurityRoute(pathname: string, search: string = ""): boolean {
  const path = normalizePath(pathname);

  for (const marker of FINANCE_PATH_MARKERS) {
    if (path === marker || path.startsWith(`${marker}/`) || path.includes(marker)) {
      return true;
    }
  }

  // Executive / network forecasting are financial surfaces.
  if (path.startsWith("/dashboard/executive/forecasting")) return true;
  if (path.startsWith("/dashboard/network/forecasting")) return true;

  // Scholarships & state funding sit in the finance operating surface.
  if (path.startsWith("/dashboard/scholarships")) return true;
  if (path.startsWith("/dashboard/admissions/state-funding")) return true;

  const view = financeViewFromSearch(search);
  if (view && FINANCE_VIEW_KEYS.has(view)) {
    return true;
  }

  // HR payroll tab is a financial security surface.
  if (path.startsWith("/dashboard/hr") && view === "payroll") {
    return true;
  }

  return false;
}

/** True when the subject may access financial security surfaces. */
export function canAccessFinance(subject: AuthzSubject): boolean {
  return hasPermission(subject, FINANCE_ENTRY_PERMISSION);
}

/** Authorize financial entry against a preloaded authz snapshot. */
export function authorizeFinanceEntry(snapshot: AuthzSnapshot): boolean {
  return authorize(snapshot, FINANCE_ENTRY_PERMISSION);
}

/**
 * Evaluate financial security for a subject.
 * Denied callers are redirected out of finance surfaces.
 */
export function evaluateFinancialSecurity(subject: AuthzSubject): {
  allowed: boolean;
  redirectTo: typeof FINANCE_DENIED_REDIRECT | null;
} {
  const snapshot = toAuthzSnapshot(subject);
  if (authorizeFinanceEntry(snapshot)) {
    return { allowed: true, redirectTo: null };
  }
  return { allowed: false, redirectTo: FINANCE_DENIED_REDIRECT };
}
