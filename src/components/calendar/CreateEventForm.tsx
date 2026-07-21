"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCalendarEventAction,
  createResourceAction,
  saveAvailabilityAction,
} from "@/lib/calendar/server-actions";
import type { CalendarResourceRow } from "@/lib/calendar/types";

const EVENT_TYPES = [
  "class",
  "meeting",
  "parent_conference",
  "iep",
  "assessment",
  "school_event",
  "holiday",
  "staff_meeting",
  "training",
  "reminder",
  "workflow_scheduled",
] as const;

interface CreateEventFormProps {
  schoolId: string | null;
  resources: CalendarResourceRow[];
  defaultDate: string;
}

export function CreateEventForm({ schoolId, resources, defaultDate }: CreateEventFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [tab, setTab] = useState<"event" | "resource" | "availability">("event");

  function close() {
    router.push(`/dashboard/calendar?date=${defaultDate}`);
  }

  function onCreateEvent(formData: FormData) {
    setError(null);
    setConflicts([]);
    startTransition(async () => {
      const result = await createCalendarEventAction(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        if ("conflicts" in result && result.conflicts) {
          setConflicts(result.conflicts.map((c) => c.message));
        }
        return;
      }
      close();
      router.refresh();
    });
  }

  function onCreateResource(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createResourceAction(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onSaveAvailability(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveAvailabilityAction(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(
            [
              ["event", "New event"],
              ["resource", "Resource"],
              ["availability", "Availability"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === key
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={close} className="text-sm text-slate-500 hover:text-slate-800">
          Close
        </button>
      </div>

      {error ? (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
          {conflicts.length > 0 ? (
            <ul className="mt-1 list-disc pl-5">
              {conflicts.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {tab === "event" ? (
        <form action={onCreateEvent} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="school_id" value={schoolId ?? ""} />
          <label className="block md:col-span-2">
            <span className="text-xs text-slate-500">Title</span>
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Parent conference"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-slate-500">Description</span>
            <textarea
              name="description"
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Type</span>
            <select name="event_type" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Recurrence</span>
            <select name="recurrence_rule" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR">Custom: Mon/Wed/Fri</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Starts</span>
            <input
              type="datetime-local"
              name="starts_at"
              required
              defaultValue={`${defaultDate}T09:00`}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Ends</span>
            <input
              type="datetime-local"
              name="ends_at"
              required
              defaultValue={`${defaultDate}T10:00`}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Teacher employee ID</span>
            <input
              name="teacher_employee_id"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Optional UUID"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Student IDs (comma-separated)</span>
            <input
              name="student_ids"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Optional UUIDs"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Family ID</span>
            <input
              name="family_id"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Resource</span>
            <select name="resource_id" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">None</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" name="create_meet" value="true" />
            <span className="text-sm text-slate-700">
              Request Google Meet link (deferred until provider configured)
            </span>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Create event"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "resource" ? (
        <form action={onCreateResource} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="school_id" value={schoolId ?? ""} />
          <label className="block md:col-span-2">
            <span className="text-xs text-slate-500">Name</span>
            <input name="name" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Type</span>
            <select name="resource_type" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="room">Room</option>
              <option value="lab">Lab</option>
              <option value="vehicle">Vehicle</option>
              <option value="equipment">Equipment</option>
              <option value="device">Device</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Capacity</span>
            <input
              type="number"
              name="capacity"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs text-slate-500">Location</span>
            <input name="location" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Create resource"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "availability" ? (
        <form action={onSaveAvailability} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="school_id" value={schoolId ?? ""} />
          <label className="block md:col-span-2">
            <span className="text-xs text-slate-500">Employee ID</span>
            <input
              name="employee_id"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Type</span>
            <select
              name="availability_type"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="working_hours">Working hours</option>
              <option value="break">Break</option>
              <option value="pto">PTO</option>
              <option value="holiday">Holiday</option>
              <option value="blocked">Blocked</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Day of week (0=Sun)</span>
            <input
              type="number"
              min={0}
              max={6}
              name="day_of_week"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Start time (HH:MM)</span>
            <input name="start_time" placeholder="09:00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">End time (HH:MM)</span>
            <input name="end_time" placeholder="17:00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Starts at (PTO / blocked)</span>
            <input type="datetime-local" name="starts_at" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Ends at</span>
            <input type="datetime-local" name="ends_at" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save availability"}
            </button>
          </div>
        </form>
      ) : null}

    </div>
  );
}
