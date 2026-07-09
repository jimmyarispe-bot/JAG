import type { ReactNode } from "react";
import { TEMPLATE_CONTENT_WIDTH } from "./tokens";

/** IMMUTABLE — Template B content shell (master: Slide 2). */
export function TemplateBShell({ children }: { children: ReactNode }) {
  return <div className={`flex w-full ${TEMPLATE_CONTENT_WIDTH} flex-col items-center`}>{children}</div>;
}
