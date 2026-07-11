const ACTIONS = [
  { href: "#conversation-workspace", label: "Ask JAG" },
  { href: "#executive-brief", label: "Morning brief" },
  { href: "#critical-alerts", label: "Review alerts" },
  { href: "#active-decisions", label: "Open decisions" },
  { href: "#goal-execution", label: "Goal execution" },
  { href: "#recommendations", label: "Recommendations" },
  { href: "#memory-explorer", label: "Memory" },
  { href: "#evidence-explorer", label: "Evidence" },
  { href: "/dashboard/executive", label: "Command Center" },
  { href: "/dashboard/mission-control", label: "Mission Control" },
] as const;

export function QuickActions() {
  return (
    <section id="quick-actions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            {action.label}
          </a>
        ))}
      </div>
    </section>
  );
}
