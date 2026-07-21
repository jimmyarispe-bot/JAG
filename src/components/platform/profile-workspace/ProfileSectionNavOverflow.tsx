"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const activeInOverflow = overflowGroups.some((g) =>
    g.sections.some((s) => s.key === activeSection)
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!overflowGroups.length) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          activeInOverflow
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        More
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 max-h-[min(24rem,70vh)] min-w-[14rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
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
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
