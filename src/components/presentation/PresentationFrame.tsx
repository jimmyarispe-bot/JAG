import type { ReactNode } from "react";
import { PresentationFooter } from "./PresentationFooter";
import { PRESENTATION_FOOTER_WRAPPER, PRESENTATION_MAIN } from "./tokens";

interface PresentationFrameProps {
  children: ReactNode;
  align?: "center" | "start";
  /** Standard footer on slides 2–15. Set false only when using coverFooter. */
  showFooter?: boolean;
  /** Slide 1 cover footer override — cycle text only. */
  coverFooter?: ReactNode;
}

export function PresentationFrame({
  children,
  align = "center",
  showFooter = true,
  coverFooter,
}: PresentationFrameProps) {
  const footerContent = coverFooter ?? (showFooter ? <PresentationFooter /> : null);

  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#222222]">
      <main
        className={`${PRESENTATION_MAIN} ${
          align === "start" ? "items-center justify-start" : "items-center justify-center"
        }`}
      >
        {children}
      </main>
      {footerContent && (
        <footer className={`${PRESENTATION_FOOTER_WRAPPER} ${coverFooter ? "px-8 py-5 text-center sm:px-16" : ""}`}>
          {footerContent}
        </footer>
      )}
    </div>
  );
}
