"use client";

import { useEffect } from "react";
import { isEditableTarget } from "@/lib/platform/crud";

export interface EntityShortcutHandlers {
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

/**
 * Platform keyboard shortcuts for entity workspaces:
 * E Edit · Del Delete · Ctrl+D Duplicate · Ctrl+S Save · Esc Cancel
 */
export function useEntityShortcuts(handlers: EntityShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) {
        // Allow Esc to cancel even from inputs when handler provided
        if (e.key === "Escape" && handlers.onCancel) {
          e.preventDefault();
          handlers.onCancel();
        }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      if (!ctrl && (e.key === "e" || e.key === "E") && handlers.onEdit) {
        e.preventDefault();
        handlers.onEdit();
        return;
      }
      if (!ctrl && e.key === "Delete" && handlers.onDelete) {
        e.preventDefault();
        handlers.onDelete();
        return;
      }
      if (ctrl && (e.key === "d" || e.key === "D") && handlers.onDuplicate) {
        e.preventDefault();
        handlers.onDuplicate();
        return;
      }
      if (ctrl && (e.key === "s" || e.key === "S") && handlers.onSave) {
        e.preventDefault();
        handlers.onSave();
        return;
      }
      if (e.key === "Escape" && handlers.onCancel) {
        e.preventDefault();
        handlers.onCancel();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers, enabled]);
}
