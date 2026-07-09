import type { ReactNode } from "react";
import { LiveDashboardBadge } from "../LiveDashboardBadge";
import { PresentationFrame } from "../PresentationFrame";
import { SlideHeader } from "../SlideHeader";
import { TEMPLATE_CONTENT_WIDTH } from "../tokens";

interface TemplateCExecutiveDashboardProps {
  phaseLabel: string;
  title: string;
  children: ReactNode;
}

/**
 * Template C — Executive Dashboard
 * Inherits Slide 2 title, spacing, footer, and color system.
 */
export function TemplateCExecutiveDashboard({ phaseLabel, title, children }: TemplateCExecutiveDashboardProps) {
  return (
    <PresentationFrame align="start">
      <div className={`w-full ${TEMPLATE_CONTENT_WIDTH} self-start`}>
        <SlideHeader eyebrow={phaseLabel} title={title} badge={<LiveDashboardBadge />} />
        {children}
      </div>
    </PresentationFrame>
  );
}
