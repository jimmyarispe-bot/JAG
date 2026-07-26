"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ANCHORED_MENU_VIEWPORT_MARGIN,
  computeAnchoredMenuPosition,
} from "./anchored-menu-position";
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
  /** Preferred horizontal alignment; collision detection may flip. */
  align?: "left" | "right";
}

/**
 * Standard list-row overflow menu (•••).
 * Hide unauthorized actions (do not disable).
 * Portaled + collision-aware so it stays in viewport (16px margin).
 */
export function EntityActionMenu({
  label = "•••",
  ariaLabel = "Actions",
  actions,
  align = "right",
}: EntityActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = actions.filter((a) => !a.hidden);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const position = computeAnchoredMenuPosition({
      trigger: {
        top: triggerRect.top,
        left: triggerRect.left,
        right: triggerRect.right,
        bottom: triggerRect.bottom,
        width: triggerRect.width,
        height: triggerRect.height,
      },
      menu: { width: menuWidth, height: menuHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      margin: ANCHORED_MENU_VIEWPORT_MARGIN,
      gap: 4,
      preferredAlign: align === "right" ? "end" : "start",
    });

    setCoords({ top: position.top, left: position.left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition, visible.length]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onReposition() {
      updatePosition();
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updatePosition]);

  if (visible.length === 0) return null;

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            className="fixed z-50 min-w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
              // Keep tall menus inside the viewport (pairs with flip/clamp).
              maxHeight: `calc(100vh - ${ANCHORED_MENU_VIEWPORT_MARGIN * 2}px)`,
            }}
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
                  // Keep focus on the overflow trigger so modals can restore it.
                  triggerRef.current?.focus();
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
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        ref={triggerRef}
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
      {menu}
    </div>
  );
}
