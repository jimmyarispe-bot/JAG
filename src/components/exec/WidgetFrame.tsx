import Link from "next/link";
import type { ReactNode } from "react";
import { DataModeBadge } from "@/components/exec/DataModeBadge";
import type { ExecDataMode } from "@/lib/exec/data-mode";

type WidgetFrameProps = {
  widgetId: string;
  title: string;
  domains: string[];
  dataMode: ExecDataMode;
  href?: string;
  children: ReactNode;
  className?: string;
};

export function WidgetFrame({
  widgetId,
  title,
  domains,
  dataMode,
  href,
  children,
  className = "",
}: WidgetFrameProps) {
  const heading = href ? (
    <Link href={href} className="hover:text-brand-700">
      {title}
    </Link>
  ) : (
    title
  );

  return (
    <section
      data-widget-id={widgetId}
      className={`flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{heading}</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {domains.join(" · ")}
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono text-[10px]">{widgetId}</span>
          </p>
        </div>
        <DataModeBadge mode={dataMode} />
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
