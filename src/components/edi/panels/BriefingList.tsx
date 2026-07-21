"use client";

export function BriefingList({ briefings }: { briefings: Array<{ id: string; briefing_type: string; title: string; summary?: string; generated_at: string }> }) {
  return (
    <ul className="space-y-3">
      {briefings.map((b) => (
        <li key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex justify-between gap-2">
            <span className="font-medium">{b.title}</span>
            <span className="text-xs capitalize text-slate-500">{b.briefing_type.replace(/_/g, " ")}</span>
          </div>
          {b.summary && <p className="mt-2 text-sm text-slate-600">{b.summary}</p>}
          <p className="mt-1 text-xs text-slate-400">{new Date(b.generated_at).toLocaleString()}</p>
        </li>
      ))}
      {!briefings.length && <li className="text-sm text-slate-500">No briefings generated yet.</li>}
    </ul>
  );
}
