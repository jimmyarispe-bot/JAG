"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FOUNDERS_UTILITY_NAV } from "@/lib/dashboard/founders-navigation";

interface UserMenuProps {
  fullName: string;
  roleLabel: string;
  initials: string;
  productName: string;
}

/** Account menu on the identity pill — settings, portal links, sign out. */
export function UserMenu({
  fullName,
  roleLabel,
  initials,
  productName,
}: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const itemClass =
    "block w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${fullName}`}
        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 py-1.5 pl-1.5 pr-3 transition-colors hover:border-slate-300 hover:bg-slate-100"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {fullName}
          </span>
          <span className="block truncate text-xs text-slate-500">{roleLabel}</span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-40 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
            <p className="truncate text-xs text-slate-500">{roleLabel}</p>
          </div>

          <div className="pt-2">
            {FOUNDERS_UTILITY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-1 border-t border-slate-100 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label={`Sign out of ${productName}`}
              className={`${itemClass} font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
