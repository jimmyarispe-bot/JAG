import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { JagHeader } from "./JagHeader";
import { JagSidebar } from "./JagSidebar";

export function JagCommandShell({
  session,
  pathname,
  organizationOptions,
  domainOptions,
  children,
}: {
  readonly session: JagPlatformSession;
  readonly pathname: string;
  readonly organizationOptions: readonly { id: string; label: string }[];
  readonly domainOptions: readonly { id: string; label: string }[];
  readonly children: React.ReactNode;
}) {
  return (
    <div className="jag-command-center flex min-h-screen bg-[var(--jag-bg)] text-[var(--jag-text)]">
      <JagSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <JagHeader
          session={session}
          organizationOptions={organizationOptions}
          domainOptions={domainOptions}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
