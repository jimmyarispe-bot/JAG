"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SignOutButtonProps {
  productName: string;
}

/** P007 — tiny client island for sign-out only. */
export function SignOutButton({ productName }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label={`Sign out of ${productName}`}
      className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}
