import type { ReactNode } from "react";
import { ImproveIcon, LeadIcon, LearnIcon, ListenIcon } from "@/components/presentation/PresentationIcons";

/**
 * Slide 3 — Executive Listening Initiative
 * Layout matches approved Slide 2. Listen • Learn • Lead • Improve only.
 */

const ROYAL_BLUE = "#2F3DBD";
const LOGO_SRC = "/presentation/micms-official-logo.png";

const STATEMENT = "Every voice informs the direction. Every decision advances student success.";

const CARDS = [
  {
    label: "LISTEN",
    subtitle: "Build Relationships & Trust",
    items: ["Faculty & Staff", "Students", "Families", "Board", "Community"],
    icon: <ListenIcon />,
  },
  {
    label: "LEARN",
    subtitle: "Understand Before Leading",
    items: ["Student Achievement", "School Culture", "Operations", "Finance", "Opportunities"],
    icon: <LearnIcon />,
  },
  {
    label: "LEAD",
    subtitle: "Create Shared Priorities",
    items: ["Share Themes", "Build Consensus", "Set Priorities", "Align Resources", "Communicate Direction"],
    icon: <LeadIcon />,
  },
  {
    label: "IMPROVE",
    subtitle: "Measure and Advance Together",
    items: ["Quick Wins", "Year One Initiatives", "Progress Reviews", "Celebrate Success", "Continuous Improvement"],
    icon: <ImproveIcon />,
  },
] as const;

function FlowArrow() {
  return (
    <div className="hidden shrink-0 items-center self-center px-0.5 lg:flex" aria-hidden>
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#CBD5E1]" fill="none">
        <path
          d="M5 12h12M14 7l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Slide03Card({
  label,
  subtitle,
  items,
  icon,
}: {
  label: string;
  subtitle: string;
  items: readonly string[];
  icon: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-7 text-center shadow-[0_4px_10px_rgba(0,0,0,0.05)] sm:p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-[#2F3DBD] shadow-sm ring-1 ring-slate-200/80 [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>
      <h2 className="mt-6 text-[30px] font-bold tracking-tight text-[#2F3DBD] sm:text-[34px]">{label}</h2>
      <p className="mt-3 text-[18px] font-semibold leading-snug text-[#64748B] sm:text-[20px]">{subtitle}</p>
      <ul className="mt-4 w-full space-y-2 text-left">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[18px] font-normal leading-snug text-[#222222]/80 sm:text-[20px]">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2F3DBD]" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function Slide03ListeningInitiative() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#222222]">
      <main className="flex flex-1 flex-col items-center justify-center px-8 py-10 sm:px-14 sm:py-12 lg:px-20">
        <div className="flex w-full max-w-7xl flex-col items-center">
          <header className="mb-14 w-full text-center sm:mb-16">
            <h1
              className="text-[56px] font-bold leading-[1.05] tracking-tight sm:text-[64px]"
              style={{ color: ROYAL_BLUE }}
            >
              Executive Listening Initiative
            </h1>
          </header>

          <div className="hidden w-full items-stretch lg:flex lg:gap-2">
            {CARDS.map((card, index) => (
              <div key={card.label} className="contents">
                {index > 0 && <FlowArrow />}
                <div className="min-w-0 flex-1">
                  <Slide03Card label={card.label} subtitle={card.subtitle} items={card.items} icon={card.icon} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:hidden lg:gap-7">
            {CARDS.map((card) => (
              <Slide03Card key={card.label} label={card.label} subtitle={card.subtitle} items={card.items} icon={card.icon} />
            ))}
          </div>

          <blockquote className="mt-16 max-w-4xl text-center text-[22px] font-normal italic leading-relaxed text-[#222222]/70 sm:mt-20 sm:text-[26px]">
            &ldquo;{STATEMENT}&rdquo;
          </blockquote>
        </div>
      </main>

      <footer className="shrink-0 border-t border-slate-100">
        <div className="grid grid-cols-1 items-center gap-4 px-8 py-5 sm:grid-cols-3 sm:px-12 lg:px-16">
          <div className="flex items-center justify-center sm:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt="Marco Island Charter Middle School"
              className="h-12 w-auto shrink-0 object-contain sm:h-14"
            />
          </div>

          <p className="text-center text-[18px] font-medium uppercase tracking-[0.22em] text-[#2F3DBD] sm:text-[20px]">
            Listen <span className="opacity-40">•</span> Learn <span className="opacity-40">•</span> Lead{" "}
            <span className="opacity-40">•</span> Improve
          </p>

          <div className="text-center sm:text-right">
            <p className="text-sm font-semibold text-[#222222] sm:text-[15px]">Jimmy Arispe</p>
            <p className="text-xs font-normal text-[#64748B] sm:text-sm">Leadership Presentation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
