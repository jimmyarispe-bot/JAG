import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagNotification } from "@/lib/jag-command-center/notifications";
import type { JagSearchItem } from "@/lib/jag-command-center/search-filter";
import type { OrganizationBrand } from "@/lib/platform/branding";
import { JagCommandPalette } from "./JagCommandPalette";
import { JagUserMenu } from "./JagUserMenu";
import { JagNotificationBell } from "./JagNotificationBell";
import { JagOrganizationSelect } from "./JagOrganizationSelect";

export function JagHeader({
  session,
  organizationOptions,
  activeOrganizationId,
  activeOrganizationLabel: _activeOrganizationLabel,
  domainOptions,
  searchCatalog,
  notifications,
  unreadNotificationCount,
  brand: _brand,
}: {
  readonly session: JagPlatformSession;
  readonly organizationOptions: readonly { id: string; label: string }[];
  readonly activeOrganizationId: string | null;
  readonly activeOrganizationLabel: string | null;
  readonly domainOptions: readonly { id: string; label: string }[];
  readonly searchCatalog: readonly JagSearchItem[];
  readonly notifications: readonly JagNotification[];
  readonly unreadNotificationCount: number;
  readonly brand: OrganizationBrand;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--jag-border)] bg-[var(--jag-bg)] px-4 md:px-6">
      {/* Org name lives in the sidebar brand + organization selector — not duplicated here. */}
      <div className="hidden min-w-0 items-center md:flex">
        <p className="truncate text-[10px] text-[var(--jag-muted)]">
          Executive Intelligence · The JAG™
        </p>
      </div>

      <div className="ml-0 flex min-w-0 flex-1 items-center gap-2 md:ml-6">
        <label className="sr-only" htmlFor="jag-org-select">
          Organization
        </label>
        <JagOrganizationSelect
          options={organizationOptions}
          activeOrganizationId={activeOrganizationId}
        />

        <label className="sr-only" htmlFor="jag-domain-select">
          Domain
        </label>
        <select
          id="jag-domain-select"
          className="max-w-[8rem] truncate rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus-visible:border-[var(--jag-border-strong)] md:max-w-[12rem]"
          defaultValue={domainOptions[0]?.id ?? ""}
          disabled={domainOptions.length === 0}
        >
          {domainOptions.length === 0 ? (
            <option value="">No domains</option>
          ) : (
            domainOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))
          )}
        </select>

        <div className="min-w-0 flex-1">
          <JagCommandPalette catalog={searchCatalog} />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <JagNotificationBell
          notifications={notifications}
          unreadCount={unreadNotificationCount}
        />
        <JagUserMenu
          displayName={session.displayName}
          roleLabel={session.role.replace(/_/g, " ")}
          initials={initials(session.displayName)}
          email={session.email}
        />
      </div>
    </header>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
