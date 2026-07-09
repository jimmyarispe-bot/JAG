import type { ReactNode } from "react";
import {
  BODY_CLASS,
  SLIDE_TITLE_CLASS,
  SUBTITLE_CLASS,
  TEMPLATE_HEADER_MB,
} from "./tokens";

interface SlideHeaderProps {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  badge?: ReactNode;
}

export function SlideHeader({ title, subtitle, eyebrow, badge }: SlideHeaderProps) {
  return (
    <header className={`w-full text-center ${TEMPLATE_HEADER_MB}`}>
      {eyebrow && <p className={`${BODY_CLASS} font-medium tracking-[0.12em] text-[#64748B] uppercase`}>{eyebrow}</p>}
      <h1 className={`${eyebrow ? "mt-4" : ""} ${SLIDE_TITLE_CLASS} text-center`}>{title}</h1>
      {subtitle &&
        (typeof subtitle === "string" ? (
          <p className={`mt-6 ${SUBTITLE_CLASS}`}>{subtitle}</p>
        ) : (
          <div className="mt-6 flex justify-center">{subtitle}</div>
        ))}
      {badge && <div className="mt-6 flex justify-center">{badge}</div>}
    </header>
  );
}
