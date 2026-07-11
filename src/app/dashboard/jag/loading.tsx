export default function JagLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-pulse" aria-busy="true" aria-label="Loading Executive Workspace">
      <div className="h-10 w-72 rounded-lg bg-slate-200" />
      <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      <div className="h-64 rounded-2xl border border-slate-200 bg-slate-50" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 rounded-2xl border border-slate-200 bg-slate-50" />
        <div className="h-48 rounded-2xl border border-slate-200 bg-slate-50" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-40 rounded-2xl border border-slate-200 bg-slate-50" />
        <div className="h-40 rounded-2xl border border-slate-200 bg-slate-50" />
      </div>
    </div>
  );
}
