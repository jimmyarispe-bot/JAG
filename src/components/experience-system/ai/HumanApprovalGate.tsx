"use client";

export function HumanApprovalGate({
  recommendationId,
  onApprove,
  onDismiss,
}: {
  recommendationId: string;
  onApprove?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3" role="group" aria-label="Human approval">
      {onApprove && (
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          onClick={() => onApprove(recommendationId)}
        >
          Approve & apply
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          onClick={() => onDismiss(recommendationId)}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
