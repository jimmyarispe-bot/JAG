import { DATA_MODE_LABEL, type ExecDataMode, isPlaceholderData } from "@/lib/exec/data-mode";

export function DataModeBadge({ mode }: { mode: ExecDataMode }) {
  if (mode === "live") {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
        {DATA_MODE_LABEL[mode]}
      </span>
    );
  }

  if (mode === "cached") {
    return (
      <span
        className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-800 ring-1 ring-violet-200/80"
        title="Serving normalized connector cache — refresh sync for live"
      >
        {DATA_MODE_LABEL[mode]}
      </span>
    );
  }

  if (!isPlaceholderData(mode)) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
        {DATA_MODE_LABEL[mode]}
      </span>
    );
  }

  const isSynthetic = mode === "synthetic";
  return (
    <span
      className={
        isSynthetic
          ? "inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/80"
          : "inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800 ring-1 ring-sky-200/80"
      }
      title="Replace with live connector data when available"
    >
      {DATA_MODE_LABEL[mode]}
    </span>
  );
}
