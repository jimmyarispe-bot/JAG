"use client";

import type { SharedDocumentsWidget } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import { cn } from "@/components/workspace-design-system/utils";

export function SharedDocuments({
  widget,
  className,
}: {
  widget: SharedDocumentsWidget;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900">{widget.title}</h3>
      {widget.documents.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No shared documents.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {widget.documents.map((doc) => (
            <li key={doc.id} className="border-t border-slate-100 pt-2 text-sm">
              <p className="font-medium text-slate-800">{doc.name}</p>
              <p className="text-xs text-slate-500">{doc.ownerEmail ?? "Shared"}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
