"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { MasteryBadge } from "../status/MasteryBadge";
import { RiskIndicator } from "../status/RiskIndicator";
import type { WdsMasteryLevel, WdsRiskLevel } from "../tokens";
import { cn } from "../utils";

export interface StudentCardProps {
  id: string;
  name: string;
  subtitle?: string;
  href?: string;
  masteryLevel?: WdsMasteryLevel;
  riskLevel?: WdsRiskLevel;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function StudentCard({
  name,
  subtitle,
  href,
  masteryLevel,
  riskLevel,
  meta,
  actions,
  className,
}: StudentCardProps) {
  const body = (
    <CardShell className={cn(href && "transition-colors hover:border-brand-200", className)} interactive={Boolean(href)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{name}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          {meta && <div className="mt-2 text-sm text-slate-600">{meta}</div>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {masteryLevel && <MasteryBadge level={masteryLevel} />}
          {riskLevel && <RiskIndicator level={riskLevel} compact />}
        </div>
      </div>
      {actions && <div className="mt-4 border-t border-slate-100 pt-3">{actions}</div>}
    </CardShell>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl">
        {body}
      </Link>
    );
  }

  return body;
}
