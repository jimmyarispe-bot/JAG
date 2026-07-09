import { DashboardPanel, SnapshotMetric } from "@/components/presentation/dashboard/DashboardPanel";
import { TemplateCExecutiveDashboard } from "@/components/presentation/templates";
import { DASHBOARD_BODY_CLASS, DASHBOARD_SECTION_CLASS } from "@/components/presentation/tokens";

const TOP_THEMES = [
  { label: "School culture & belonging", share: "28%" },
  { label: "Communication clarity", share: "24%" },
  { label: "Academic expectations", share: "19%" },
  { label: "Student support systems", share: "16%" },
];

const STRENGTHS = [
  "Dedicated, student-centered faculty",
  "Strong family and community engagement",
  "Clear school identity and pride",
  "Collaborative leadership team",
];

const OPPORTUNITIES = [
  "Consistent communication across channels",
  "Middle-grade transition support",
  "Expanded student voice in decisions",
  "Cross-team alignment on priorities",
];

const RESPONSE_MATRIX = [
  {
    theme: "Culture & belonging",
    response: "Launch monthly community listening forums",
    timeline: "30 days",
  },
  {
    theme: "Communication",
    response: "Unified weekly executive briefing",
    timeline: "14 days",
  },
  {
    theme: "Academic expectations",
    response: "Department data review with leads",
    timeline: "21 days",
  },
];

const LEADERSHIP_PRIORITIES = [
  "Establish a sustained listening cadence with staff and families",
  "Publish a transparent leadership response tracker",
  "Align school priorities to community input and mission",
];

function ThemeBar({ label, share }: { label: string; share: string }) {
  const width = share.replace("%", "");

  return (
    <div>
      <div className={`mb-2 flex items-center justify-between gap-2 ${DASHBOARD_BODY_CLASS}`}>
        <span className="font-medium text-[#222222]">{label}</span>
        <span className="tabular-nums text-[#64748B]">{share}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F8FAFC]">
        <div className="h-full rounded-full bg-[#2F3DBD]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className={`flex gap-3 ${DASHBOARD_BODY_CLASS}`}>
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F3DBD]" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Slide04ListeningIntelligence() {
  return (
    <TemplateCExecutiveDashboard phaseLabel="Listen" title="Executive Listening Intelligence">
      <section className="mb-6 sm:mb-8">
        <p className={`mb-5 ${DASHBOARD_SECTION_CLASS}`}>Executive Snapshot</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotMetric label="Responses" value="847" detail="Across all stakeholder groups" />
          <SnapshotMetric label="Completion rate" value="94%" detail="Two-minute form average" />
          <SnapshotMetric label="Stakeholder groups" value="6" detail="Staff, families, students, board" />
          <SnapshotMetric label="Listening window" value="Day 42" detail="90-day initiative progress" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Top Themes">
          <div className="space-y-4">
            {TOP_THEMES.map((theme) => (
              <ThemeBar key={theme.label} label={theme.label} share={theme.share} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Strengths">
          <BulletList items={STRENGTHS} />
        </DashboardPanel>

        <DashboardPanel title="Opportunities">
          <BulletList items={OPPORTUNITIES} />
        </DashboardPanel>

        <DashboardPanel title="Leadership Response Matrix">
          <div className="overflow-x-auto">
            <table className={`w-full min-w-[280px] text-left ${DASHBOARD_BODY_CLASS}`}>
              <thead>
                <tr className="border-b border-slate-100 text-[#64748B]">
                  <th className="pb-3 pr-3 font-medium">Theme</th>
                  <th className="pb-3 pr-3 font-medium">Leadership Response</th>
                  <th className="pb-3 font-medium">Timeline</th>
                </tr>
              </thead>
              <tbody className="text-[#222222]/80">
                {RESPONSE_MATRIX.map((row) => (
                  <tr key={row.theme} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-3 align-top font-medium text-[#222222]">{row.theme}</td>
                    <td className="py-3 pr-3 align-top">{row.response}</td>
                    <td className="py-3 align-top tabular-nums text-[#64748B]">{row.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Leadership Priorities" className="mt-6">
        <ol className="grid gap-4 sm:grid-cols-3">
          {LEADERSHIP_PRIORITIES.map((priority, index) => (
            <li key={priority} className="rounded-2xl border border-slate-200/80 bg-[#F8FAFC] px-5 py-4">
              <span className="mb-2 block text-[18px] font-semibold tracking-[0.12em] text-[#2F3DBD] uppercase">
                Priority {index + 1}
              </span>
              <span className={DASHBOARD_BODY_CLASS}>{priority}</span>
            </li>
          ))}
        </ol>
      </DashboardPanel>
    </TemplateCExecutiveDashboard>
  );
}
