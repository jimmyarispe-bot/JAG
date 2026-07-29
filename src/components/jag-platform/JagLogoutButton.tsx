"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";

export function JagLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    await fetch("/api/jag-platform/auth/logout", { method: "POST" });
    router.replace(JAG_PLATFORM_LOGIN_PATH);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
