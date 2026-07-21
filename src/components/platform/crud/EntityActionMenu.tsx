"use client";

import { useEffect, useId, useRef, useState } from "react";
import { crudBtn } from "./button-styles";

export interface EntityMenuAction {
  id: string;
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  hidden?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

interface EntityActionMenuProps {
  label?: string;
  /** Accessible name for the trigger */
  ariaLabel?: string;
  actions: EntityMenuAction[];
  align?: "left" | "right";
}

/**
 * Standard list-row overflow menu (•••).
 * Hide unauthorized actions (do not disable).
 */
export function EntityActionMenu({
  label = "•••",
  ariaLabel = "Actions",
  actions,
  align = "right",
}: EntityActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = actions.filter((a) => !a.hidden);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={crudBtn.overflowTrigger}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{label}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute z-30 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {visible.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              className={
                action.tone === "danger" ? crudBtn.menuItemDanger : crudBtn.menuItem
              }
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
            >
              <span className="flex items-center justify-between gap-4">
                <span>{action.label}</span>
                {action.shortcut ? (
                  <span className="text-xs text-slate-400">{action.shortcut}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
