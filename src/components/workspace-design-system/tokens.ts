/** Semantic design tokens — maps to @theme vars in globals.css */
export const wdsTokens = {
  color: {
    brand50: "var(--color-brand-50)",
    brand100: "var(--color-brand-100)",
    brand500: "var(--color-brand-500)",
    brand600: "var(--color-brand-600)",
    brand700: "var(--color-brand-700)",
    brand900: "var(--color-brand-900)",
    sidebar: "var(--color-sidebar)",
    sidebarHover: "var(--color-sidebar-hover)",
    sidebarBorder: "var(--color-sidebar-border)",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    card: "1rem",
    pill: "9999px",
  },
  shadow: {
    card: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
    cardHover: "0 4px 6px -1px rgb(15 23 42 / 0.08)",
    panel: "0 10px 15px -3px rgb(15 23 42 / 0.08)",
  },
} as const;

export const wdsAccentClasses = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500", ring: "ring-indigo-200" },
  emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500", ring: "ring-emerald-200" },
  amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500", ring: "ring-amber-200" },
  sky: { icon: "bg-sky-50 text-sky-600", bar: "bg-sky-500", ring: "ring-sky-200" },
  violet: { icon: "bg-violet-50 text-violet-600", bar: "bg-violet-500", ring: "ring-violet-200" },
  rose: { icon: "bg-rose-50 text-rose-600", bar: "bg-rose-500", ring: "ring-rose-200" },
  brand: { icon: "bg-brand-50 text-brand-600", bar: "bg-brand-500", ring: "ring-brand-200" },
} as const;

export type WdsAccent = keyof typeof wdsAccentClasses;

export const wdsMasteryLevels = {
  emerging: { label: "Emerging", tone: "bg-slate-100 text-slate-700" },
  developing: { label: "Developing", tone: "bg-sky-100 text-sky-800" },
  proficient: { label: "Proficient", tone: "bg-brand-100 text-brand-800" },
  mastered: { label: "Mastered", tone: "bg-emerald-100 text-emerald-800" },
} as const;

export type WdsMasteryLevel = keyof typeof wdsMasteryLevels;

export const wdsRiskLevels = {
  low: { label: "Low risk", tone: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  moderate: { label: "Moderate", tone: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  high: { label: "High risk", tone: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
} as const;

export type WdsRiskLevel = keyof typeof wdsRiskLevels;
