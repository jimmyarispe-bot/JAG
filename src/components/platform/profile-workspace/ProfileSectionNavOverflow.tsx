"use client";

import Link from "next/link";
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
} from "@/components/platform/crud/anchored-menu-position";
import type {
  ClientProfileNavigationGroup,
  ClientProfileNavSection,
} from "@/lib/platform/profile/types";

interface ProfileSectionNavOverflowProps {
  overflowGroups: ClientProfileNavigationGroup[];
  activeSection: string;
}

function SectionLink({
  section,
  active,
  onNavigate,
}: {
  section: ClientProfileNavSection;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={section.href}
      onClick={onNavigate}
      role="menuitem"
      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {section.label}
      {section.status === "placeholder" && (
        <span className="ml-1.5 text-[10px] uppercase text-slate-400">Soon</span>
      )}
    </Link>
  );
}

/** Dropdown for profile sections beyond the primary nav threshold. */
export function ProfileSectionNavOverflow({
  overflowGroups,
  activeSection,
}: ProfileSectionNavOverflowProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const activeInOverflow = overflowGroups.some((g) =>
    g.sections.some((s) => s.key === activeSection)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const position = computeAnchoredMenuPosition({
      trigger: {
        top: triggerRect.top,
        left: triggerRect.left,
        right: triggerRect.right,
        bottom: triggerRect.bottom,
        width: triggerRect.width,
        height: triggerRect.height,
      },
      menu: { width: menu.offsetWidth, height: menu.offsetHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      margin: ANCHORED_MENU_VIEWPORT_MARGIN,
      gap: 4,
      preferredAlign: "start",
    });
    setCoords({ top: position.top, left: position.left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition, overflowGroups.length]);

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

  if (!overflowGroups.length) return null;

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            className="fixed z-50 min-w-[14rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
              maxHeight: `calc(100vh - ${ANCHORED_MENU_VIEWPORT_MARGIN * 2}px)`,
            }}
          >
            {overflowGroups.map((group) => (
              <div key={group.group} className="mb-2 last:mb-0">
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.sections.map((section) => (
                    <SectionLink
                      key={section.key}
                      section={section}
                      active={activeSection === section.key}
                      onNavigate={() => {
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          activeInOverflow
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        More
      </button>
      {menu}
    </div>
  );
}
