"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/components/workspace-design-system/utils";

/**
 * Skeleton → Loading → Fade in transition for resolved widget content.
 * Respects prefers-reduced-motion via global CSS.
 */
export function FadeIn({
  children,
  className,
  durationMs = 280,
}: {
  children: ReactNode;
  className?: string;
  durationMs?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "transition-opacity ease-out",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
      style={{ transitionDuration: `${durationMs}ms` }}
    >
      {children}
    </div>
  );
}
