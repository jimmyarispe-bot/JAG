"use client";

/** The browser's own print dialog, where "Save as PDF" is the PDF. */
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 print:hidden"
    >
      {label}
    </button>
  );
}
