import type { ReactNode } from "react";
import { cn } from "../utils";

interface MainContentProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "none" | "5xl" | "6xl" | "7xl";
}

const maxWidthMap = {
  none: "",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function MainContent({ children, className, maxWidth = "7xl" }: MainContentProps) {
  return (
    <main className={cn("min-w-0 flex-1 overflow-y-auto p-4 sm:p-6", className)}>
      <div className={cn("mx-auto w-full space-y-6", maxWidthMap[maxWidth])}>{children}</div>
    </main>
  );
}
