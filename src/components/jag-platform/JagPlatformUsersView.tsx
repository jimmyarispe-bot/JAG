"use client";

import { useMemo, useState, useTransition } from "react";
import type { JagPlatformDirectoryUser } from "@/lib/jag-platform/platform-users";
import {
  provisionJagPlatformUserAction,
  revokeJagPlatformAccessAction,
} from "@/lib/jag-platform/platform-users-actions";
import {
  deactivateJagPlatformUserAction,
  reactivateJagPlatformUserAction,
  resendJagPlatformSetupEmailAction,
  updateJagPlatformUserAction,
} from "@/lib/jag-platform/platform-user-admin-actions";
import {
  JAG_ASSIGNABLE_ROLES,
  type JagPlatformUserStatus,
} from "@/lib/jag-platform/platform-user-admin-shared";
import { JAG_PLATFORM_GRANT_ROLE } from "@/lib/jag-platform/platform-access";

const inputClass =
  "mt-1 w-full rounded border border-[var(--jag-border)] bg-[var(--jag-panel-2)] px-2 py-1.5 text-[var(--jag-text)]";

function splitName(displayName: string, email: string): {
  first: string;
  last: string;
} {
  if (!displayName || displayName === email) return { first: "", last: "" };
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0] ?? "", last: "" };
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1] ?? "",
  };
}

export function JagPlatformUsersView({
  users,
  loadError,
  statuses = [],
}: {
  readonly users: readonly JagPlatformDirectoryUser[];
  readonly loadError: string | null;
  readonly statuses?: readonly JagPlatformUserStatus[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState("");

  const deactivatedAtById = useMemo(() => {
    const map = new Map<string, string>();
    for (const status of statuses) {
      if (status.deactivatedAt) map.set(status.userId, status.deactivatedAt);
    }
    return map;
  }, [statuses]);

  const deactivatedCount = deactivatedAtById.size;

  const visibleUsers = useMemo(
    () =>
      showDeactivated
        ? users
        : users.filter((user) => !deactivatedAtById.has(user.id)),
    [users, showDeactivated, deactivatedAtById]
  );

  const selected = useMemo(
    () =>
      visibleUsers.find((user) => user.id === selectedId) ??
      visibleUsers[0] ??
      null,
    [visibleUsers, selectedId]
  );

  const selectedDeactivatedAt = selected
    ? deactivatedAtById.get(selected.id) ?? null
    : null;
  const selectedIsFounder = Boolean(
    selected?.layers.jag.roles.includes("FOUNDER")
  );
  const currentRole =
    selected?.layers.jag.roles.find((role) =>
      (JAG_ASSIGNABLE_ROLES as readonly string[]).includes(role)
    ) ?? JAG_PLATFORM_GRANT_ROLE;
  const nameParts = selected
    ? splitName(selected.displayName, selected.email)
    : { first: "", last: "" };

  function run(
    action: () => Promise<{ error?: string; success?: boolean; message?: string }>,
    ok: string,
    onSuccess?: () => void
  ) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.error ?? result.message ?? ok);
      if (!result.error) {
        setShowAdd(false);
        onSuccess?.();
      }
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
        <p className="text-sm text-[var(--jag-text)]" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-[var(--jag-muted)]">
          <input
            type="checkbox"
            checked={showDeactivated}
            onChange={(event) => setShowDeactivated(event.target.checked)}
          />
          Show deactivated
          {deactivatedCount ? ` (${deactivatedCount})` : ""}
        </label>
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
            <input name="first_name" required className={inputClass} />
          </label>
          <label className="text-sm text-[var(--jag-text)]">
            Last name
            <input name="last_name" required className={inputClass} />
          </label>
          <label className="sm:col-span-2 text-sm text-[var(--jag-text)]">
            Email
            <input name="email" type="email" required className={inputClass} />
          </label>
          <input type="hidden" name="role" value={JAG_PLATFORM_GRANT_ROLE} />
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-[var(--jag-text)] px-3 py-2 text-sm font-medium text-[var(--jag-bg)] disabled:opacity-60"
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
              {visibleUsers.map((user) => {
                const deactivatedAt = deactivatedAtById.get(user.id) ?? null;
                return (
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
                        onClick={() => {
                          setSelectedId(user.id);
                          setShowEdit(false);
                          setConfirmDeactivate("");
                        }}
                        className="text-left text-[var(--jag-text)]"
                      >
                        <span className="block font-medium">
                          {user.displayName}
                          {deactivatedAt ? (
                            <span className="ml-2 rounded bg-[var(--jag-panel-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--jag-muted)]">
                              Deactivated
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-xs text-[var(--jag-muted)]">
                          {user.email}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-[var(--jag-text)]">
                      {deactivatedAt
                        ? "Deactivated"
                        : user.layers.jag.active
                          ? "Active"
                          : "None"}
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
                );
              })}
              {visibleUsers.length === 0 ? (
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
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-[var(--jag-text)]">
                {selected.displayName}
              </h2>
              <p className="text-xs text-[var(--jag-muted)]">{selected.email}</p>
              {selectedDeactivatedAt ? (
                <p className="text-xs text-amber-300">
                  Deactivated {new Date(selectedDeactivatedAt).toLocaleString()} ·
                  sign-in blocked
                </p>
              ) : null}
            </div>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--jag-muted)]">
                JAG Platform
              </h3>
              <p className="text-sm text-[var(--jag-text)]">
                {selectedDeactivatedAt
                  ? "Deactivated"
                  : selected.layers.jag.active
                    ? "Active"
                    : "None"}
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

            {/* ---------------------------------------------------------- */}
            {/* Manage                                                      */}
            {/* ---------------------------------------------------------- */}
            <section className="space-y-3 border-t border-[var(--jag-border)] pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--jag-muted)]">
                Manage
              </h3>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit((open) => !open)}
                  className="rounded border border-[var(--jag-border)] px-2.5 py-1.5 text-xs text-[var(--jag-text)]"
                >
                  {showEdit ? "Cancel edit" : "Edit"}
                </button>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fd = new FormData(event.currentTarget);
                    run(
                      () => resendJagPlatformSetupEmailAction(fd),
                      "Setup email sent."
                    );
                  }}
                >
                  <input type="hidden" name="user_id" value={selected.id} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded border border-[var(--jag-border)] px-2.5 py-1.5 text-xs text-[var(--jag-text)] disabled:opacity-60"
                  >
                    Resend setup email
                  </button>
                </form>

                {selectedDeactivatedAt ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const fd = new FormData(event.currentTarget);
                      run(
                        () => reactivateJagPlatformUserAction(fd),
                        "User reactivated."
                      );
                    }}
                  >
                    <input type="hidden" name="user_id" value={selected.id} />
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded border border-emerald-500/40 px-2.5 py-1.5 text-xs text-emerald-300 disabled:opacity-60"
                    >
                      Reactivate
                    </button>
                  </form>
                ) : null}
              </div>

              {showEdit ? (
                <form
                  className="grid gap-3 rounded border border-[var(--jag-border)] bg-[var(--jag-panel-2)] p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fd = new FormData(event.currentTarget);
                    run(
                      () => updateJagPlatformUserAction(fd),
                      "User updated.",
                      () => setShowEdit(false)
                    );
                  }}
                >
                  <input type="hidden" name="user_id" value={selected.id} />
                  <label className="text-xs text-[var(--jag-text)]">
                    First name
                    <input
                      name="first_name"
                      defaultValue={nameParts.first}
                      required
                      className={inputClass}
                    />
                  </label>
                  <label className="text-xs text-[var(--jag-text)]">
                    Last name
                    <input
                      name="last_name"
                      defaultValue={nameParts.last}
                      required
                      className={inputClass}
                    />
                  </label>
                  <label className="text-xs text-[var(--jag-text)]">
                    Email
                    <input
                      name="email"
                      type="email"
                      defaultValue={selected.email}
                      required
                      className={inputClass}
                    />
                    <span className="mt-1 block text-[10px] text-[var(--jag-muted)]">
                      Changing this changes their sign-in identity.
                    </span>
                  </label>
                  {selectedIsFounder ? (
                    <p className="text-[10px] text-[var(--jag-muted)]">
                      FOUNDER role is managed outside this screen.
                    </p>
                  ) : (
                    <label className="text-xs text-[var(--jag-text)]">
                      JAG role
                      <select
                        name="role"
                        defaultValue={currentRole}
                        className={inputClass}
                      >
                        {JAG_ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded bg-[var(--jag-text)] px-3 py-2 text-xs font-medium text-[var(--jag-bg)] disabled:opacity-60"
                  >
                    Save changes
                  </button>
                </form>
              ) : null}

              {!selectedIsFounder && !selectedDeactivatedAt ? (
                <form
                  className="space-y-2 rounded border border-red-500/30 bg-red-500/5 p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fd = new FormData(event.currentTarget);
                    run(
                      () => deactivateJagPlatformUserAction(fd),
                      "User deactivated.",
                      () => setConfirmDeactivate("")
                    );
                  }}
                >
                  <input type="hidden" name="user_id" value={selected.id} />
                  <p className="text-[11px] text-[var(--jag-muted)]">
                    Deactivating blocks sign-in immediately. Roles, history and
                    audit records are kept, and you can reactivate at any time.
                    Type <strong className="text-red-300">DEACTIVATE</strong> to
                    confirm.
                  </p>
                  <input
                    name="confirm"
                    value={confirmDeactivate}
                    onChange={(event) => setConfirmDeactivate(event.target.value)}
                    placeholder="DEACTIVATE"
                    aria-label="Type DEACTIVATE to confirm"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={
                      pending || confirmDeactivate.trim().toUpperCase() !== "DEACTIVATE"
                    }
                    className="rounded border border-red-500/40 px-2.5 py-1.5 text-xs text-red-300 disabled:opacity-40"
                  >
                    Deactivate user
                  </button>
                </form>
              ) : null}

              {selected.layers.jag.roles.includes("FOUNDER") ? null : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fd = new FormData(event.currentTarget);
                    run(
                      () => revokeJagPlatformAccessAction(fd),
                      "JAG platform access revoked"
                    );
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
            </section>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
