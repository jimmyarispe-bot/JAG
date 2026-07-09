const TOP_MODULES = ["Executive Listening", "Academic", "Student"] as const;
const BOTTOM_MODULES = ["Operational", "Community", "Innovation"] as const;

export function ExecutiveIntelligenceHub() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="grid grid-cols-3 gap-4 sm:gap-5">
        {TOP_MODULES.map((label) => (
          <ModuleCard key={label} label={label} />
        ))}

        <ModuleCard label="Financial" />
        <ExecutiveCore />
        <ModuleCard label="Workforce" />

        {BOTTOM_MODULES.map((label) => (
          <ModuleCard key={label} label={label} />
        ))}
      </div>
    </div>
  );
}

function ExecutiveCore() {
  return (
    <article className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-[#2F3DBD] bg-white p-5 shadow-sm sm:p-6">
      <div
        className="pointer-events-none absolute inset-2 rounded-xl border border-[#2F3DBD]/10 bg-[#F8FAFC]"
        aria-hidden
      />
      <div className="relative text-center">
        <p className="text-[18px] font-semibold tracking-[0.12em] text-[#2F3DBD] uppercase sm:text-[20px]">
          Command Center
        </p>
        <h2 className="mt-2 text-[22px] font-bold tracking-tight text-[#222222] sm:text-[24px]">
          Executive Intelligence
        </h2>
        <p className="mt-2 text-[20px] leading-snug text-[#64748B] sm:text-[22px]">All modules connected</p>
      </div>
    </article>
  );
}

function ModuleCard({ label }: { label: string }) {
  return (
    <article className="flex min-h-[84px] flex-col justify-center rounded-2xl border border-slate-200/80 bg-[#F8FAFC] px-4 py-4 shadow-sm sm:min-h-[92px] sm:px-5">
      <p className="text-[18px] font-medium tracking-wide text-[#64748B] uppercase sm:text-[20px]">Intelligence</p>
      <p className="mt-1 text-[20px] font-semibold leading-snug text-[#222222] sm:text-[22px]">{label}</p>
    </article>
  );
}
