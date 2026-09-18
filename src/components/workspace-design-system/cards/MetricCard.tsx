import type { ReactNode } from "react";
import Link from "next/link";
import { CardShell } from "./CardShell";
import { wdsAccentClasses, type WdsAccent } from "../tokens";

export interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accent: WdsAccent;
  /**
   * Where the number goes when you click it.
   *
   * A count is a question - "476 what?" - and a card that answers it only by
   * sitting there is a poster. With an href the card becomes the door to the
   * thing it counts; without one it stays exactly as it was, so every other
   * workspace using this card is untouched.
   */
  href?: string;
}

export function MetricCard({ title, value, description, icon, accent, href }: MetricCardProps) {
  const styles = wdsAccentClasses[accent];

  const body = (
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
  );

  if (!href) {
    return (
      <CardShell className="group transition-shadow hover:shadow-md" accentBar={styles.bar} padding="lg">
        {body}
      </CardShell>
    );
  }

  /* The affordance has to be visible before the cursor arrives. A card that
     only reveals it is clickable on hover is not discoverable on a touch
     screen at all. */
  return (
    <Link
      href={href}
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <CardShell
        className="group cursor-pointer transition-shadow hover:shadow-md"
        accentBar={styles.bar}
        padding="lg"
      >
        {body}
      </CardShell>
    </Link>
  );
}
