import type { ReactNode } from "react";
import { ImproveIcon, LeadIcon, LearnIcon, ListenIcon } from "@/components/presentation/PresentationIcons";

/**
 * SLIDE 2 — LOCKED
 * Standalone approved design. Do not refactor into shared templates.
 * Content-only changes when explicitly requested.
 */

const ROYAL_BLUE = "#2F3DBD";
const LOGO_SRC = "/presentation/micms-official-logo.png";

const CARDS = [
  {
    label: "LISTEN",
    body: "Build trust by listening first and understanding before acting.",
    icon: <ListenIcon />,
  },
  {
    label: "LEARN",
    body: "Transform information into insight through data, observation, and meaningful relationships.",
    icon: <LearnIcon />,
  },
  {
    label: "LEAD",
    body: "Lead with integrity, transparency, accountability, and a relentless focus on students.",
    icon: <LeadIcon />,
  },
  {
    label: "IMPROVE",
    body: "Measure what matters, celebrate progress, and continuously improve together.",
    icon: <ImproveIcon />,
  },
] as const;

function Slide02Card({ label, body, icon }: { label: string; body: string; icon: ReactNode }) {
  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-7 text-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-[#2F3DBD] shadow-sm ring-1 ring-slate-200/80 [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>
      <h2 className="mt-6 text-[30px] font-bold tracking-tight text-[#2F3DBD] sm:text-[34px]">{label}</h2>
      <p className="mt-4 text-[20px] font-normal leading-relaxed text-[#222222]/80 sm:text-[22px]">{body}</p>
    </article>
  );
}

export function Slide02HowILead() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#222222]">
      <main className="flex flex-1 flex-col items-center justify-center px-8 py-10 sm:px-14 sm:py-12 lg:px-20">
        <div className="flex w-full max-w-7xl flex-col items-center">
          <header className="mb-14 w-full text-center sm:mb-16">
            <h1
              className="text-[56px] font-bold leading-[1.05] tracking-tight sm:text-[64px]"
              style={{ color: ROYAL_BLUE }}
            >
              My Leadership Philosophy
            </h1>
          </header>

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
            {CARDS.map((card) => (
              <Slide02Card key={card.label} label={card.label} body={card.body} icon={card.icon} />
            ))}
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-100">
        <div className="flex items-center justify-between gap-6 px-8 py-5 sm:px-12 lg:px-16">
          <div className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt="Marco Island Charter Middle School"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-[#222222] sm:text-[15px]">Jimmy Arispe</p>
            <p className="text-xs font-normal text-[#64748B] sm:text-sm">Leadership Presentation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
