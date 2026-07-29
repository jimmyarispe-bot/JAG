import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagNotification } from "@/lib/jag-command-center/notifications";
import type { JagSearchItem } from "@/lib/jag-command-center/search-filter";
import { JagHeader } from "./JagHeader";
import { JagSidebar } from "./JagSidebar";

export function JagCommandShell({
  session,
  pathname,
  organizationOptions,
  domainOptions,
  searchCatalog,
  notifications,
  unreadNotificationCount,
  children,
}: {
  readonly session: JagPlatformSession;
  readonly pathname: string;
  readonly organizationOptions: readonly { id: string; label: string }[];
  readonly domainOptions: readonly { id: string; label: string }[];
  readonly searchCatalog: readonly JagSearchItem[];
  readonly notifications: readonly JagNotification[];
  readonly unreadNotificationCount: number;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="jag-command-center flex min-h-screen bg-[var(--jag-bg)] text-[var(--jag-text)]">
      <a href="#jag-main" className="jag-skip-link">
        Skip to main content
      </a>
      <JagSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <JagHeader
          session={session}
          organizationOptions={organizationOptions}
          domainOptions={domainOptions}
          searchCatalog={searchCatalog}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
        />
        <main
          id="jag-main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 xl:px-8"
        >
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
