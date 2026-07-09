import type { ReactNode } from "react";
import {
  BODY_CLASS,
  CARD_BODY_CLASS,
  CARD_TITLE_CLASS,
  DASHBOARD_BODY_CLASS,
  DASHBOARD_PANEL_TITLE_CLASS,
  SECTION_HEADING_CLASS,
  SLIDE_TITLE_CLASS,
} from "./tokens";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function SlideTitle({ children, className = "" }: TypographyProps) {
  return <h1 className={`${SLIDE_TITLE_CLASS} ${className}`.trim()}>{children}</h1>;
}

export function SectionHeading({ children, className = "" }: TypographyProps) {
  return <h2 className={`${SECTION_HEADING_CLASS} ${className}`.trim()}>{children}</h2>;
}

export function BodyText({ children, className = "" }: TypographyProps) {
  return <p className={`${BODY_CLASS} ${className}`.trim()}>{children}</p>;
}

export function CardTitle({ children, className = "" }: TypographyProps) {
  return <h3 className={`${CARD_TITLE_CLASS} ${className}`.trim()}>{children}</h3>;
}

export function CardBody({ children, className = "" }: TypographyProps) {
  return <p className={`${CARD_BODY_CLASS} ${className}`.trim()}>{children}</p>;
}

export function DashboardPanelTitle({ children, className = "" }: TypographyProps) {
  return <h3 className={`${DASHBOARD_PANEL_TITLE_CLASS} ${className}`.trim()}>{children}</h3>;
}

export function DashboardBody({ children, className = "" }: TypographyProps) {
  return <p className={`${DASHBOARD_BODY_CLASS} ${className}`.trim()}>{children}</p>;
}
