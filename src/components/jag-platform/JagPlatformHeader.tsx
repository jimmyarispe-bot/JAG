import { JagLogoutButton } from "@/components/jag-platform/JagLogoutButton";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function JagPlatformHeader({
  session,
}: {
  readonly session: JagPlatformSession;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">The JAG™ Platform</h1>
        <p className="text-xs text-slate-500">
          {session.displayName} · {session.role}
        </p>
      </div>
      <JagLogoutButton />
    </header>
  );
}
