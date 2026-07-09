export function LiveDashboardBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-[#F8FAFC] px-4 py-2">
      <span className="inline-flex h-2 w-2 rounded-full bg-[#2F3DBD]" aria-hidden />
      <span className="text-sm font-semibold tracking-wide text-[#222222] uppercase sm:text-[15px]">
        Live Dashboard
      </span>
    </div>
  );
}
