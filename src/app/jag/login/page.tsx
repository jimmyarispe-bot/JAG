import { Suspense } from "react";
import { redirect } from "next/navigation";
import { JagLoginForm } from "@/components/jag-platform/JagLoginForm";
import { JAG_PLATFORM_HOME_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagLoginPage() {
  const session = await getJagPlatformSession();
  if (session) {
    redirect(JAG_PLATFORM_HOME_PATH);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
      <Suspense fallback={<p className="p-8 text-white">Loading…</p>}>
        <JagLoginForm />
      </Suspense>
    </div>
  );
}
