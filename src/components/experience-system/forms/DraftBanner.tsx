export function DraftBanner({
  onDiscard,
  onRestore,
}: {
  onDiscard: () => void;
  onRestore?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
      <span>You have an unsaved draft.</span>
      <div className="flex gap-2">
        {onRestore && (
          <button type="button" className="font-medium text-brand-600 hover:underline" onClick={onRestore}>
            Restore
          </button>
        )}
        <button type="button" className="font-medium text-slate-600 hover:underline" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
