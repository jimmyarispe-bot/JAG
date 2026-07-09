/**
 * MICMS Executive Presentation — IMMUTABLE design specification.
 * Master: Slide 2 (Template B). Content-only changes unless explicitly requested.
 */

export const PRESENTATION_COLORS = {
  royalBlue: "#2F3DBD",
  charcoal: "#222222",
  white: "#FFFFFF",
  lightGray: "#F8FAFC",
  border: "#E2E8F0",
  muted: "#64748B",
  lightMuted: "#94A3B8",
  divider: "#CBD5E1",
} as const;

export const SCHOOL_LOGO_SRC = "/presentation/micms-official-logo.png";

/** Closing slide content logo — not footer */
export const CLOSING_LOGO_CLASS = "h-auto w-full max-w-[480px] object-contain sm:max-w-[560px]";

/** Template B shell — locked main canvas */
export const PRESENTATION_MAIN =
  "flex flex-1 flex-col px-8 py-10 sm:px-14 sm:py-12 lg:px-20";

/** Template B shell — locked footer divider and wrapper (slides 2–15) */
export const PRESENTATION_FOOTER_WRAPPER = "shrink-0 border-t border-slate-100";

/** Template B shell — locked interior footer grid */
export const PRESENTATION_FOOTER =
  "grid grid-cols-1 items-center gap-4 px-8 py-5 sm:grid-cols-3 sm:px-12 lg:px-16";

export const FOOTER_LOGO_CLASS = "h-12 w-auto shrink-0 object-contain sm:h-14";

export const FOOTER_CYCLE_CLASS =
  "text-[18px] font-medium tracking-[0.22em] text-[#2F3DBD] uppercase sm:text-[20px]";

export const FOOTER_PRESENTER_NAME_CLASS = "text-sm font-semibold text-[#222222] sm:text-[15px]";

export const FOOTER_PRESENTER_ROLE_CLASS = "text-xs font-normal text-[#64748B] sm:text-sm";

/** Cover footer — Slide 1 only */
export const COVER_FOOTER_CLASS =
  "text-[18px] font-medium tracking-[0.24em] text-[#64748B] uppercase sm:text-[20px]";

/** Template B — content width and spacing */
export const TEMPLATE_CONTENT_WIDTH = "max-w-7xl";
export const TEMPLATE_NARROW_WIDTH = "max-w-3xl";
export const TEMPLATE_HEADER_MB = "mb-14 sm:mb-16";
export const TEMPLATE_STATEMENT_MT = "mt-16 sm:mt-20";
export const TEMPLATE_CARD_GRID = "grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7";
export const TEMPLATE_CARD_GRID_2X2 = "grid w-full gap-6 sm:grid-cols-2 lg:gap-7";

/** Template B — slide title */
export const SLIDE_TITLE_CLASS =
  "text-[56px] font-bold tracking-tight text-[#2F3DBD] sm:text-[64px] leading-[1.05]";

/** Template B — subtitle (Listen • Learn • Lead • Improve) */
export const SUBTITLE_CLASS = "text-[22px] font-medium leading-relaxed text-[#64748B] sm:text-[24px]";

/** Template B — executive philosophy card (Slide 2 master) */
export const PRESENTATION_CARD =
  "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 p-7 shadow-sm sm:p-8";

export const PRESENTATION_CARD_ACCENT =
  "absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-[#2F3DBD] opacity-90";

export const PRESENTATION_ICON_BOX =
  "flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 text-[#2F3DBD] [&_svg]:h-7 [&_svg]:w-7";

export const PHILOSOPHY_CARD_KEYWORD_CLASS =
  "mt-6 text-2xl font-semibold tracking-tight text-[#2F3DBD] sm:text-3xl text-center";

export const PHILOSOPHY_CARD_BODY_CLASS =
  "mt-4 text-base font-normal leading-relaxed text-slate-600 sm:text-lg text-center";

/** Template B — closing statement */
export const BODY_CLASS =
  "text-[22px] font-normal leading-relaxed text-[#222222] sm:text-[24px]";

export const STATEMENT_CLASS = `${BODY_CLASS} text-[#222222]/70 italic sm:text-[26px]`;

/** Template C — dashboard panels (same card language, data layout differs) */
export const PRESENTATION_DASHBOARD_PANEL =
  "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7";

export const SECTION_HEADING_CLASS =
  "text-[32px] font-semibold tracking-tight text-[#222222] sm:text-[36px]";

export const CARD_TITLE_CLASS =
  "text-[30px] font-bold tracking-tight text-[#2F3DBD] sm:text-[34px] text-center";

export const CARD_BODY_CLASS =
  "text-[20px] font-normal leading-relaxed text-[#222222]/80 sm:text-[22px] text-center";

export const DASHBOARD_PANEL_TITLE_CLASS =
  "text-[22px] font-semibold text-[#222222] sm:text-[24px]";

export const DASHBOARD_SECTION_CLASS =
  "text-[22px] font-semibold tracking-wide text-[#64748B] uppercase sm:text-[24px]";

export const DASHBOARD_BODY_CLASS =
  "text-[20px] font-normal text-[#222222]/75 sm:text-[22px]";
