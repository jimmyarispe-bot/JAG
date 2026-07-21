import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/components/workspace-design-system/utils";

export function SkeletonBone({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200/90", className)}
      style={style}
      aria-hidden
    />
  );
}

export function SkeletonBlock({
  className,
  children,
  label = "Loading…",
}: {
  className?: string;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <div
      className={cn("relative", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}
