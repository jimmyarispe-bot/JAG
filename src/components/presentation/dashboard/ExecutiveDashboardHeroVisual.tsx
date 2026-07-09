import { DashboardPanel, SnapshotMetric } from "@/components/presentation/dashboard/DashboardPanel";
import { DASHBOARD_BODY_CLASS, PRESENTATION_DASHBOARD_PANEL } from "@/components/presentation/tokens";

const INSIGHTS = [
  { title: "Enrollment pipeline ahead of forecast", emphasis: false },
  { title: "Compliance deadline in 14 days", emphasis: true },
  { title: "Intervention effectiveness trending up", emphasis: false },
];

export function ExecutiveDashboardHeroVisual() {
  return (
    <div className="h-full w-full bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-5">
          <div>
            <p className="text-[18px] font-medium tracking-wide text-[#64748B] uppercase sm:text-[20px]">
              Executive Intelligence
            </p>
            <h2 className="text-[24px] font-semibold tracking-tight text-[#222222] sm:text-[28px]">Command Center</h2>
          </div>
          <div className="flex gap-2">
            {["Today", "Decisions", "Risk"].map((tab, i) => (
              <span
                key={tab}
                className={`rounded-lg px-3 py-1.5 text-[18px] font-medium sm:text-[20px] ${
                  i === 0
                    ? "bg-[#2F3DBD] text-white shadow-sm"
                    : "bg-white text-[#222222] ring-1 ring-slate-200/80"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SnapshotMetric label="Work in queue" value="12" detail="Executive priorities today" />
          <SnapshotMetric label="Compliance alerts" value="3" detail="Requires leadership attention" />
          <SnapshotMetric label="Strategic decisions" value="5" detail="Awaiting executive action" />
          <SnapshotMetric label="Board ready" value="2" detail="Reports prepared for review" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <article className={`${PRESENTATION_DASHBOARD_PANEL} lg:col-span-2`}>
            <h3 className="text-[22px] font-semibold text-[#222222] sm:text-[24px]">Executive Insights</h3>
            <ul className="mt-4 space-y-3">
              {INSIGHTS.map((insight) => (
                <li
                  key={insight.title}
                  className={`rounded-xl px-4 py-3 ${DASHBOARD_BODY_CLASS} ${
                    insight.emphasis
                      ? "border border-slate-200/80 bg-[#F8FAFC] font-medium text-[#222222]"
                      : "border border-slate-100 bg-white text-[#222222]/80"
                  }`}
                >
                  {insight.title}
                </li>
              ))}
            </ul>
          </article>

          <article className={PRESENTATION_DASHBOARD_PANEL}>
            <h3 className="text-[22px] font-semibold text-[#222222] sm:text-[24px]">Mission Control</h3>
            <dl className={`mt-4 space-y-3 ${DASHBOARD_BODY_CLASS}`}>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Open items</dt>
                <dd className="font-semibold text-[#222222]">24</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Overdue tasks</dt>
                <dd className="font-semibold text-[#222222]">4</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Compliance alerts</dt>
                <dd className="font-semibold text-[#222222]">3</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#64748B]">Intervention effectiveness</dt>
                <dd className="font-semibold text-[#222222]">87%</dd>
              </div>
            </dl>
          </article>
        </div>
      </div>
    </div>
  );
}
