"use client";

import { WidgetCardActions } from "@/components/executive-command-center/WidgetCardActions";
import type {
  DrillDownAction,
  WidgetCard,
  WorkspaceWidget,
} from "@/lib/platform/intelligence/executive-command-center";
import { cn } from "@/components/workspace-design-system/utils";

export interface CommandCenterWidgetProps {
  widget: WorkspaceWidget;
  className?: string;
  onAction?: (action: DrillDownAction, card: WidgetCard, widget: WorkspaceWidget) => void;
}

export function CommandCenterWidget({
  widget,
  className,
  onAction,
}: CommandCenterWidgetProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {widget.sourceDomain} · priority {widget.priority}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{widget.title}</h3>
          {widget.subtitle ? (
            <p className="mt-1 text-sm text-slate-600">{widget.subtitle}</p>
          ) : null}
        </div>
      </div>

      {widget.cards.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{widget.emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {widget.cards.map((card) => (
            <li
              key={card.id}
              className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{card.title}</h4>
                {card.score != null || card.severity != null ? (
                  <span className="text-xs font-medium text-slate-600">
                    {card.score ?? card.severity}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-700">{card.summary}</p>
              <WidgetCardActions
                card={card}
                actions={widget.actions}
                onAction={(action, c) => onAction?.(action, c, widget)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
