import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { wdsAccentClasses, type WdsAccent } from "../tokens";

export interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accent: WdsAccent;
}

export function MetricCard({ title, value, description, icon, accent }: MetricCardProps) {
  const styles = wdsAccentClasses[accent];

  return (
    <CardShell className="group transition-shadow hover:shadow-md" accentBar={styles.bar} padding="lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
          {icon}
        </div>
      </div>
    </CardShell>
  );
}
