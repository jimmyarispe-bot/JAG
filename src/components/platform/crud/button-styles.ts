/** Shared AcademyOS action button tokens — use everywhere for CRUD consistency. */

export const crudBtn = {
  primary:
    "rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50",
  secondary:
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger:
    "rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50",
  dangerSolid:
    "rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40",
  ghost:
    "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50",
  menuItem: "block w-full px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  menuItemDanger:
    "block w-full px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50",
  overflowTrigger:
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-600 hover:bg-slate-50",
} as const;
