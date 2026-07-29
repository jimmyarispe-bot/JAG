import type { JagPlatformSession } from "@/lib/jag-platform/session";

export function JagHeader({
  session,
  organizationOptions,
  domainOptions,
}: {
  readonly session: JagPlatformSession;
  readonly organizationOptions: readonly { id: string; label: string }[];
  readonly domainOptions: readonly { id: string; label: string }[];
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--jag-border)] bg-[var(--jag-bg)] px-4 md:px-6">
      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <span className="font-[family-name:var(--font-jag-display)] text-sm font-semibold tracking-tight text-[var(--jag-text)]">
          JAG
        </span>
        <span className="text-[var(--jag-border-strong)]">/</span>
        <span className="truncate text-xs text-[var(--jag-muted)]">
          Command Center
        </span>
      </div>

      <div className="ml-8 flex min-w-0 flex-1 items-center gap-2 md:ml-6">
        <label className="sr-only" htmlFor="jag-org-select">
          Organization
        </label>
        <select
          id="jag-org-select"
          className="max-w-[10rem] truncate rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)] md:max-w-[14rem]"
          defaultValue={organizationOptions[0]?.id ?? ""}
          disabled={organizationOptions.length === 0}
        >
          {organizationOptions.length === 0 ? (
            <option value="">No organizations</option>
          ) : (
            organizationOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))
          )}
        </select>

        <label className="sr-only" htmlFor="jag-domain-select">
          Domain
        </label>
        <select
          id="jag-domain-select"
          className="max-w-[9rem] truncate rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-text)] outline-none focus:border-[var(--jag-border-strong)] md:max-w-[12rem]"
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

        <label className="sr-only" htmlFor="jag-search">
          Search
        </label>
        <input
          id="jag-search"
          type="search"
          placeholder="Search"
          className="hidden min-w-0 flex-1 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-1.5 text-xs text-[var(--jag-text)] outline-none placeholder:text-[var(--jag-muted-2)] focus:border-[var(--jag-border-strong)] sm:block"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="truncate text-xs font-medium text-[var(--jag-text)]">
            {session.displayName}
          </p>
          <p className="truncate text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
            {session.role.replace(/_/g, " ")}
          </p>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] text-xs font-medium text-[var(--jag-text)]"
          aria-hidden
        >
          {initials(session.displayName)}
        </div>
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
