export default function FounderLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      </div>
      <p className="text-sm text-slate-500">Loading Founder Workspace…</p>
    </div>
  );
}
