"use client";

import Link from "next/link";
import { EntityActionMenu, type EntityMenuAction } from "./EntityActionMenu";
import { crudBtn } from "./button-styles";

export interface ToolbarAction {
  id: string;
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "primary" | "secondary" | "danger";
  hidden?: boolean;
  disabled?: boolean;
}

interface EntityActionToolbarProps {
  /** Primary actions shown as buttons (Edit, Archive, Delete) */
  actions: ToolbarAction[];
  /** Overflow “More” menu */
  moreActions?: EntityMenuAction[];
  historyHref?: string;
  className?: string;
}

/**
 * Profile / detail upper-right action toolbar.
 * Unauthorized actions must be omitted (hidden), never shown disabled for permission.
 */
export function EntityActionToolbar({
  actions,
  moreActions = [],
  historyHref,
  className = "",
}: EntityActionToolbarProps) {
  const visible = actions.filter((a) => !a.hidden);
  const moreVisible = moreActions.filter((a) => !a.hidden);

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 ${className}`}
      role="toolbar"
      aria-label="Record actions"
    >
      {historyHref ? (
        <Link href={historyHref} className={crudBtn.secondary}>
          History
        </Link>
      ) : null}
      {visible.map((action) => {
        const toneClass =
          action.tone === "primary"
            ? crudBtn.primary
            : action.tone === "danger"
              ? crudBtn.danger
              : crudBtn.secondary;
        if (action.href) {
          return (
            <Link key={action.id} href={action.href} className={toneClass}>
              {action.label}
            </Link>
          );
        }
        return (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            className={toneClass}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        );
      })}
      {moreVisible.length > 0 ? (
        <EntityActionMenu ariaLabel="More actions" label="More" actions={moreVisible} />
      ) : null}
    </div>
  );
}
