"use client";

import { useEffect, useState } from "react";
import type { DirectoryPerson } from "@/lib/people/directory-shared";

/**
 * Removing people, with archive as the default and deletion as the exception.
 *
 * Archive is one click: the record keeps its history and can be put back.
 * Permanent deletion needs a ticked box and the word DELETE typed out, and the
 * server refuses anyone carrying attendance, grades, invoices, an application
 * or a note history regardless of what is typed here — this dialog is the
 * second lock, not the only one.
 *
 * When the server refuses part of a selection it names who and why. A bulk
 * delete that quietly skips eleven of eighty rows is worse than one that fails.
 */

export type RemoveOutcome = {
  ok: boolean;
  error?: string;
  blocked?: { id: string; name: string; reason: string }[];
};

const TOKEN = "DELETE";

export function PersonRemoveDialog({
  people,
  onClose,
  onArchive,
  onDelete,
}: {
  people: DirectoryPerson[];
  onClose: () => void;
  onArchive: (reason: string | null) => Promise<RemoveOutcome>;
  onDelete: (confirmationText: string, acknowledged: boolean) => Promise<RemoveOutcome>;
}) {
  const [mode, setMode] = useState<"archive" | "delete">("archive");
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<{ id: string; name: string; reason: string }[]>([]);

  const many = people.length > 1;
  const who = many
    ? `${people.length} records`
    : `${people[0].lastName}, ${people[0].firstName}`;
  const nameOf = (id: string) => {
    const person = people.find((p) => p.id === id);
    return person ? `${person.lastName}, ${person.firstName}` : id;
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  async function run() {
    setBusy(true);
    setError(null);
    setBlocked([]);
    const result =
      mode === "archive"
        ? await onArchive(reason.trim() || null)
        : await onDelete(typed, acknowledged);
    setBusy(false);
    if (result.ok) {
      onClose();
      return;
    }
    setError(result.error ?? "Could not complete");
    setBlocked(result.blocked ?? []);
  }

  const canDelete = acknowledged && typed === TOKEN;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Remove ${who}`}
        className="mt-16 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">Remove {who}</h2>

        <div className="mt-5 space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
            <input
              type="radio"
              checked={mode === "archive"}
              onChange={() => setMode("archive")}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">Archive</span>
              <span className="block text-sm text-slate-500">
                Taken off the list, kept in the database. Attendance, grades, invoices and
                notes all survive, and you can put {many ? "them" : "them"} back.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-rose-200 p-3 hover:bg-rose-50/50">
            <input
              type="radio"
              checked={mode === "delete"}
              onChange={() => setMode("delete")}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-rose-800">Delete permanently</span>
              <span className="block text-sm text-slate-500">
                Erased. This cannot be undone and nobody can recover it for you. Refused
                automatically for anyone with records attached — use it for test rows and
                duplicates.
              </span>
            </span>
          </label>
        </div>

        {mode === "archive" ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Reason (optional)
            </span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Left the network, duplicate record…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        ) : (
          <div className="mt-4 space-y-3 rounded-xl bg-rose-50 p-4">
            <label className="flex items-start gap-2 text-sm text-rose-900">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                I understand {many ? `these ${people.length} records` : "this record"} will be
                erased and cannot be recovered.
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-rose-800">
                Type {TOKEN} to confirm
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>
        )}

        {blocked.length > 0 && (
          <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {blocked.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{nameOf(b.id)}</td>
                    <td className="px-3 py-2 text-slate-600">{b.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {blocked.length ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={busy || (mode === "delete" && !canDelete)}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              mode === "delete" ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-800 hover:bg-slate-900"
            }`}
          >
            {busy
              ? "Working…"
              : mode === "archive"
                ? `Archive${many ? ` ${people.length}` : ""}`
                : `Delete${many ? ` ${people.length}` : ""} permanently`}
          </button>
        </div>
      </div>
    </div>
  );
}
