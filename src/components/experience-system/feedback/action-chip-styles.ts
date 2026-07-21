/**
 * UX-003 — shared CTA visual tokens for ActionChip / ActionButton.
 */

export type ActionChipVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type ActionChipSize = "xs" | "sm" | "md" | "lg";

/** Pill chrome shared by every actionable control. */
export const ACTION_CHIP_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full font-medium cursor-pointer " +
  "transition-colors duration-150 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 " +
  "min-h-11 min-w-11";

export const ACTION_CHIP_SIZE: Record<ActionChipSize, string> = {
  xs: "px-3 py-2 text-xs gap-1",
  sm: "px-3.5 py-2 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-1.5",
  lg: "px-5 py-3 text-base gap-2",
};

export const ACTION_CHIP_VARIANT: Record<ActionChipVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500/40 disabled:bg-brand-600",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400/30 disabled:bg-white",
  outline:
    "border border-brand-300 bg-transparent text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500/30",
  ghost:
    "border border-transparent bg-transparent text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500/30",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40 disabled:bg-emerald-600",
  warning:
    "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500/40 disabled:bg-amber-500",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/40 disabled:bg-rose-600",
  info: "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500/40 disabled:bg-sky-600",
};

/**
 * Infer CTA variant from common action labels (Open → primary, Approve → success, …).
 */
export function inferActionChipVariant(label: string): ActionChipVariant {
  const t = label.trim().toLowerCase();
  if (
    /^(approve|accept|complete|publish|confirm|enroll|pay|hire|activate)\b/.test(t) ||
    /\b(approve|accept|complete|publish)\b/.test(t)
  ) {
    return "success";
  }
  if (
    /^(delete|reject|remove|archive|decline|cancel|revoke)\b/.test(t) ||
    /\b(delete|reject|remove|archive)\b/.test(t)
  ) {
    return "danger";
  }
  if (
    /^(review|needs attention|pending|resolve|retry|investigate)\b/.test(t) ||
    /\b(review|pending|attention)\b/.test(t)
  ) {
    return "warning";
  }
  if (/^(open|continue|start|launch|create|new|add|generate|analyze|connect|sync)\b/.test(t)) {
    return "primary";
  }
  if (/^(view|details|history|message|invite|schedule|manage|export|import|download|upload|refresh)\b/.test(t)) {
    return "secondary";
  }
  if (/^(dismiss|close|hide|explain)\b/.test(t)) {
    return "ghost";
  }
  return "secondary";
}
