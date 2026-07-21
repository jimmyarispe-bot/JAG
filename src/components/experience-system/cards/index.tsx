import type { ReactNode } from "react";
import {
  CardShell,
  CompetencyCard as WdsCompetencyCard,
  EvidenceCard as WdsEvidenceCard,
  RecommendationCard as WdsRecommendationCard,
  StudentCard as WdsStudentCard,
  type CompetencyCardProps,
  type EvidenceCardProps,
  type RecommendationCardProps,
  type StudentCardProps,
} from "@/components/workspace-design-system";
import { RiskIndicator } from "@/components/workspace-design-system/status/RiskIndicator";
import { cn } from "@/components/workspace-design-system/utils";
import type { WdsMasteryLevel, WdsRiskLevel } from "@/components/workspace-design-system/tokens";
import { ActionChip, ActionChipGroup } from "@/components/experience-system/feedback/ActionChip";
import { inferActionChipVariant } from "@/components/experience-system/feedback/action-chip-styles";

export { WdsStudentCard as StudentCard, type StudentCardProps };
export { WdsCompetencyCard as CompetencyCard, type CompetencyCardProps };
export { WdsEvidenceCard as EvidenceCard, type EvidenceCardProps };
export { WdsRecommendationCard as RecommendationCard, type RecommendationCardProps };
export { ModuleCard, type ModuleCardProps } from "./ModuleCard";

export interface FamilyCardProps {
  id: string;
  name: string;
  subtitle?: string;
  href?: string;
  studentCount?: number;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function FamilyCard({ name, subtitle, href, studentCount, meta, actions, className }: FamilyCardProps & { className?: string }) {
  return (
    <CardShell className={cn(href && "transition-colors hover:border-brand-200", className)} interactive={Boolean(href)}>
      <h3 className="font-semibold text-slate-900">{name}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      {studentCount !== undefined && (
        <p className="mt-1 text-xs text-slate-500">{studentCount} student{studentCount === 1 ? "" : "s"}</p>
      )}
      {meta && <div className="mt-2 text-sm text-slate-600">{meta}</div>}
      {href || actions ? (
        <ActionChipGroup className="mt-4 border-t border-slate-100 pt-3">
          {href ? (
            <ActionChip href={href} size="sm" variant="secondary">
              View family
            </ActionChip>
          ) : null}
          {actions}
        </ActionChipGroup>
      ) : null}
    </CardShell>
  );
}

export interface EmployeeCardProps {
  id: string;
  name: string;
  role?: string;
  href?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function EmployeeCard({ name, role, href, meta, actions, className }: EmployeeCardProps & { className?: string }) {
  return (
    <CardShell className={cn(href && "transition-colors hover:border-brand-200", className)} interactive={Boolean(href)}>
      <h3 className="font-semibold text-slate-900">{name}</h3>
      {role && <p className="mt-1 text-sm text-slate-500">{role}</p>}
      {meta && <div className="mt-2 text-sm text-slate-600">{meta}</div>}
      {href || actions ? (
        <ActionChipGroup className="mt-4 border-t border-slate-100 pt-3">
          {href ? (
            <ActionChip href={href} size="sm" variant="secondary">
              View employee
            </ActionChip>
          ) : null}
          {actions}
        </ActionChipGroup>
      ) : null}
    </CardShell>
  );
}

export interface SessionCardProps {
  id: string;
  timeDisplay: string;
  title: string;
  subtitle?: string;
  status: string;
  statusComplete?: boolean;
  href: string;
  alerts?: { type: string; message: string }[];
  meta?: ReactNode;
  actions?: ReactNode;
  highlighted?: boolean;
}

export function SessionCard({
  timeDisplay,
  title,
  subtitle,
  status,
  statusComplete = false,
  href,
  alerts = [],
  meta,
  actions,
  highlighted,
}: SessionCardProps) {
  const alertColors: Record<string, string> = {
    medical: "bg-rose-50 text-rose-700",
    iep: "bg-violet-50 text-violet-700",
    behavior: "bg-amber-50 text-amber-700",
    funding: "bg-sky-50 text-sky-700",
  };

  return (
    <CardShell
      interactive
      padding="md"
      className={highlighted ? "ring-2 ring-brand-500 ring-offset-2" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-600">{timeDisplay}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
            statusComplete ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700"
          )}
        >
          {status.replace(/_/g, " ")}
        </span>
      </div>
      {alerts.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <li key={i} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", alertColors[a.type] ?? "bg-slate-100 text-slate-600")}>
              {a.type}: {a.message}
            </li>
          ))}
        </ul>
      )}
      {meta}
      <ActionChipGroup className="mt-4 border-t border-slate-100 pt-4">
        <ActionChip href={href} size="sm" variant="primary">
          Open session
        </ActionChip>
        {actions}
      </ActionChipGroup>
    </CardShell>
  );
}

export interface AlertCardProps {
  title: string;
  message: string;
  severity?: "low" | "medium" | "high";
  href?: string;
  actionLabel?: string;
}

export function AlertCard({ title, message, severity = "medium", href, actionLabel }: AlertCardProps) {
  const tone =
    severity === "high" ? "border-rose-200 bg-rose-50" : severity === "low" ? "border-sky-200 bg-sky-50" : "border-amber-200 bg-amber-50";

  return (
    <CardShell className={tone} padding="md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <RiskIndicator level={severity === "high" ? "high" : severity === "low" ? "low" : "moderate"} compact />
      </div>
      <p className="mt-2 text-sm text-slate-700">{message}</p>
      {href && actionLabel ? (
        <ActionChipGroup className="mt-3">
          <ActionChip href={href} size="sm" variant={inferActionChipVariant(actionLabel.replace(/\s*→\s*$/, ""))}>
            {actionLabel.replace(/\s*→\s*$/, "")}
          </ActionChip>
        </ActionChipGroup>
      ) : null}
    </CardShell>
  );
}

export function PriorityCard({
  title,
  description,
  href,
  tone = "brand",
}: {
  title: string;
  description: string;
  href: string;
  tone?: "brand" | "amber" | "rose";
}) {
  const toneClass = {
    brand: "border-brand-200 bg-brand-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    rose: "border-rose-200 bg-rose-50/60",
  };

  return (
    <CardShell className={toneClass[tone]} interactive padding="md">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{description}</p>
      <ActionChipGroup className="mt-3">
        <ActionChip href={href} size="sm" variant="primary">
          Take action
        </ActionChip>
      </ActionChipGroup>
    </CardShell>
  );
}

export type { WdsMasteryLevel, WdsRiskLevel };
