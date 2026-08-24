"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface JagUserMenuProps {
  readonly displayName: string;
  readonly roleLabel: string;
  readonly initials: string;
  readonly email?: string | null;
}

const MENU_LINKS = [
  { href: "/jag/settings", label: "Settings" },
  { href: "/jag/users", label: "JAG Platform Users" },
] as const;

/** Account menu for the JAG Command Center header — settings and sign out. */
export function JagUserMenu({
  displayName,
  roleLabel,
  initials,
  email,
}: JagUserMenuProps) {
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

    // Clears the signed JAG session cookie as well as the Supabase session.
    try {
      await fetch("/api/jag-platform/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Fall through — the Supabase sign-out below still runs.
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/jag/login");
    router.refresh();
  };

  const itemClass =
    "block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-[var(--jag-text)] transition-colors hover:bg-[var(--jag-panel)]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        className="flex cursor-pointer items-center gap-2 rounded border border-transparent px-1 py-1 transition-colors hover:border-[var(--jag-border)] hover:bg-[var(--jag-panel)]"
      >
        <span className="hidden text-right sm:block">
          <span className="block truncate text-xs font-medium text-[var(--jag-text)]">
            {displayName}
          </span>
          <span className="block truncate text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            {roleLabel}
          </span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] text-xs font-medium text-[var(--jag-text)]">
          {initials}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded border border-[var(--jag-border)] bg-[var(--jag-bg)] p-2 shadow-lg"
        >
          <div className="border-b border-[var(--jag-border)] px-3 pb-2 pt-1">
            <p className="truncate text-sm font-medium text-[var(--jag-text)]">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-[var(--jag-muted)]">
              {email || roleLabel}
            </p>
          </div>

          <div className="pt-2">
            {MENU_LINKS.map((item) => (
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

          <div className="mt-1 border-t border-[var(--jag-border)] pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className={`${itemClass} font-medium text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
