"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { initialsFromName, cn } from "../utils";

interface ShellUserProfileProps {
  fullName: string;
  roleLabel: string;
  onSignOut?: () => void;
  className?: string;
}

export function ShellUserProfile({ fullName, roleLabel, onSignOut, className }: ShellUserProfileProps) {
  const router = useRouter();
  const initials = initialsFromName(fullName);

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 py-1.5 pl-1.5 pr-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
          <p className="truncate text-xs text-slate-500">{roleLabel}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sign out"
        className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        Sign out
      </button>
    </div>
  );
}
