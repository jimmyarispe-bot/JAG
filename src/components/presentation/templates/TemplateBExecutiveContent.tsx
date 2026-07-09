import type { ReactNode } from "react";
import { ExecutiveStatement } from "../ExecutiveStatement";
import { PresentationFooter } from "../PresentationFooter";
import { PresentationFrame } from "../PresentationFrame";
import { SlideHeader } from "../SlideHeader";
import { TemplateBShell } from "../TemplateBShell";
import { PRESENTATION_FOOTER_WRAPPER, PRESENTATION_MAIN, TEMPLATE_NARROW_WIDTH } from "../tokens";

interface TemplateBExecutiveContentProps {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  statement?: ReactNode;
  statementBordered?: boolean;
  narrow?: boolean;
  leading?: ReactNode;
  hero?: ReactNode;
  children: ReactNode;
}

/** Template B — Executive Content (IMMUTABLE layout; content-only changes). */
export function TemplateBExecutiveContent({
  title,
  subtitle,
  eyebrow,
  statement,
  statementBordered = false,
  narrow = false,
  leading,
  hero,
  children,
}: TemplateBExecutiveContentProps) {
  const widthClass = narrow ? TEMPLATE_NARROW_WIDTH : undefined;

  const body = (
    <TemplateBShell>
      <div className={widthClass ? `flex w-full ${widthClass} flex-col items-center` : "flex w-full flex-col items-center"}>
        {leading}
        <SlideHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
        {children}
        {statement && <ExecutiveStatement bordered={statementBordered}>{statement}</ExecutiveStatement>}
      </div>
    </TemplateBShell>
  );

  if (hero) {
    return (
      <div className="relative flex min-h-screen flex-col bg-white text-[#222222]">
        {hero}
        <main className={`${PRESENTATION_MAIN} relative z-10 -mt-16 items-center justify-start sm:-mt-20`}>
          {body}
        </main>
        <footer className={PRESENTATION_FOOTER_WRAPPER}>
          <PresentationFooter />
        </footer>
      </div>
    );
  }

  return <PresentationFrame>{body}</PresentationFrame>;
}
