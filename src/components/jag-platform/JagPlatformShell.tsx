import { JagPlatformHeader } from "@/components/jag-platform/JagPlatformHeader";
import { JagPlatformSidebar } from "@/components/jag-platform/JagPlatformSidebar";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function JagPlatformShell({
  session,
  pathname,
  children,
}: {
  readonly session: JagPlatformSession;
  readonly pathname: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <JagPlatformSidebar pathname={pathname} session={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <JagPlatformHeader session={session} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
