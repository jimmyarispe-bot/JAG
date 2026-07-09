import type { ReactNode } from "react";
import { cn } from "../utils";

interface CardShellProps {
  children: ReactNode;
  className?: string;
  accentBar?: string;
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddingMap = { sm: "p-4", md: "p-5", lg: "p-6" };

export function CardShell({
  children,
  className,
  accentBar,
  padding = "md",
  interactive = false,
}: CardShellProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        interactive && "transition-shadow hover:shadow-md",
        paddingMap[padding],
        className
      )}
    >
      {accentBar && <div className={cn("absolute inset-x-0 top-0 h-1 opacity-80", accentBar)} />}
      {children}
    </article>
  );
}
