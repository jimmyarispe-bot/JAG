"use client";

import { useMemo, useState, useTransition } from "react";
import type { JagPlatformDirectoryUser } from "@/lib/jag-platform/platform-users";
import {
  provisionJagPlatformUserAction,
  revokeJagPlatformAccessAction,
} from "@/lib/jag-platform/platform-users-actions";
import { JAG_PLATFORM_GRANT_ROLE } from "@/lib/jag-platform/platform-access";

export function JagPlatformUsersView({
  users,
  loadError,
}: {
  readonly users: readonly JagPlatformDirectoryUser[];
  readonly loadError: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);

  const selected = useMemo(
    () => users.find((user) => user.id === selectedId) ?? users[0] ?? null,
    [users, selectedId]
  );

  function run(
    action: () => Promise<{ error?: string; success?: boolean; message?: string }>,
    ok: string
  ) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.error ?? result.message ?? ok);
      if (!result.error) setShowAdd(false);
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--jag-muted)]">
          The JAG™ · Layer 1
        </p>
        <h1 className="font-[family-name:var(--font-jag-display)] text-2xl font-semibold tracking-tight text-[var(--jag-text)]">
          JAG Platform Users
        </h1>
        <p className="max-w-2xl text-sm text-[var(--jag-muted)]">
          Platform identities and access to The JAG itself. This is not AcademyOS
          organization administration. Organization membership is not required
          for JAG access.
        </p>
      </header>

      {loadError ? (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {loadError}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-[var(--jag-text)]">{message}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdd((open) => !open)}
          className="rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-sm text-[var(--jag-text)]"
        >
          {showAdd ? "Cancel" : "Add JAG platform user"}
        </button>
      </div>

      {showAdd ? (
        <form
          className="grid gap-3 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            run(() => provisionJagPlatformUserAction(fd), "JAG platform access granted");
          }}
        >
          <p className="sm:col-span-2 text-xs text-[var(--jag-muted)]">
            Existing people keep their AcademyOS roles and memberships. New
            people are created as JAG-only — no organization is assigned.
          </p>
          <label className="text-sm text-[var(--jag-text)]">
            First name
            <input
              name="first_name"
              required
              className="mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel-2)] px-2 py-1.5"
            />
          </label>
          <label className="text-sm text-[var(--jag-text)]">
            Last name
            <input
              name="last_name"
              required
              className="mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel-2)] px-2 py-1.5"
            />
          </label>
          <label className="sm:col-span-2 text-sm text-[var(--jag-text)]">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel-2)] px-2 py-1.5"
            />
          </label>
          <input type="hidden" name="role" value={JAG_PLATFORM_GRANT_ROLE} />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-[var(--jag-text)] px-3 py-2 text-sm font-medium text-[var(--jag-bg)]"
            >
              Grant JAG access
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
        <div className="overflow-hidden rounded border border-[var(--jag-border)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--jag-panel)] text-[11px] uppercase tracking-wide text-[var(--jag-muted)]">
              <tr>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">JAG Platform</th>
                <th className="px-3 py-2">AcademyOS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={
                    selected?.id === user.id
                      ? "bg-[var(--jag-panel-2)]"
                      : "hover:bg-[var(--jag-panel)]"
                  }
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(user.id)}
                      className="text-left text-[var(--jag-text)]"
                    >
                      <span className="block font-medium">{user.displayName}</span>
                      <span className="block text-xs text-[var(--jag-muted)]">
                        {user.email}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2 text-[var(--jag-text)]">
                    {user.layers.jag.active ? "Active" : "None"}
                    <span className="block text-xs text-[var(--jag-muted)]">
                      {user.layers.jag.roles.join(", ") || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--jag-text)]">
                    {user.layers.academyOs.active
                      ? user.layers.academyOs.organizations[0]?.name ?? "Active"
                      : "None"}
                    <span className="block text-xs text-[var(--jag-muted)]">
                      {user.layers.academyOs.roles.join(", ") || "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-[var(--jag-muted)]">
                    No JAG platform users yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {selected ? (
          <aside className="space-y-4 rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
            <h2 className="text-lg font-medium text-[var(--jag-text)]">
              {selected.displayName}
            </h2>
            <p className="text-xs text-[var(--jag-muted)]">{selected.email}</p>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--jag-muted)]">
                JAG Platform
              </h3>
              <p className="text-sm text-[var(--jag-text)]">
                {selected.layers.jag.active ? "Active" : "None"}
              </p>
              <p className="text-xs text-[var(--jag-muted)]">
                {selected.layers.jag.roles.join(", ") || "No platform role"}
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--jag-muted)]">
                AcademyOS
              </h3>
              {selected.layers.academyOs.organizations.length ? (
                selected.layers.academyOs.organizations.map((org) => (
                  <p key={org.id} className="text-sm text-[var(--jag-text)]">
                    {org.name}
                    <span className="block text-xs text-[var(--jag-muted)]">
                      {selected.layers.academyOs.roles.join(", ") || org.membershipRole}{" "}
                      · {org.status}
                    </span>
                  </p>
                ))
              ) : (
                <p className="text-sm text-[var(--jag-muted)]">
                  No organization membership
                </p>
              )}
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--jag-muted)]">
                Effective JAG permissions
              </h3>
              <ul className="max-h-40 overflow-auto text-xs text-[var(--jag-muted)]">
                {selected.layers.jag.permissions.map((key) => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </section>

            {selected.layers.jag.roles.includes("FOUNDER") ? null : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const fd = new FormData(event.currentTarget);
                  run(() => revokeJagPlatformAccessAction(fd), "JAG platform access revoked");
                }}
              >
                <input type="hidden" name="user_id" value={selected.id} />
                <button
                  type="submit"
                  disabled={pending}
                  className="text-xs text-[var(--jag-muted)] underline"
                >
                  Revoke JAG platform access
                </button>
              </form>
            )}
          </aside>
        ) : null}
      </div>

    </div>
  );
}
