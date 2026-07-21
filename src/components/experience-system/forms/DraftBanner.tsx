"use client";

import { ActionChip, ActionChipGroup } from "@/components/ui/cta";

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
      <ActionChipGroup>
        {onRestore && (
          <ActionChip type="button" size="xs" variant="primary" onClick={onRestore}>
            Restore
          </ActionChip>
        )}
        <ActionChip type="button" size="xs" variant="ghost" onClick={onDiscard}>
          Discard
        </ActionChip>
      </ActionChipGroup>
    </div>
  );
}
