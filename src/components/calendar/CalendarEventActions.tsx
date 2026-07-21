"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/experience-system/interaction";
import { EntityActionMenu } from "@/components/platform/crud";
import {
  cancelCalendarEventAction,
  duplicateCalendarEventAction,
} from "@/lib/calendar/server-actions";

interface CalendarEventActionsProps {
  eventId: string;
  title: string;
  /** Synthetic SIS sessions cannot be mutated via platform calendar */
  readOnly?: boolean;
}

export function CalendarEventActions({
  eventId,
  title,
  readOnly = false,
}: CalendarEventActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);

  if (readOnly || eventId.startsWith("session:")) return null;

  return (
    <>
      <EntityActionMenu
        ariaLabel={`Actions for ${title}`}
        actions={[
          {
            id: "duplicate",
            label: "Duplicate",
            shortcut: "Ctrl+D",
            disabled: pending,
            onSelect: () => {
              startTransition(async () => {
                await duplicateCalendarEventAction(eventId);
                router.refresh();
              });
            },
          },
          {
            id: "cancel",
            label: "Cancel event",
            tone: "danger",
            disabled: pending,
            onSelect: () => setCancelOpen(true),
          },
        ]}
      />
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel event"
        message={`Cancel “${title}”? Attendees will no longer see this occurrence as scheduled.`}
        confirmLabel="Cancel event"
        tone="danger"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => {
          startTransition(async () => {
            await cancelCalendarEventAction(eventId);
            setCancelOpen(false);
            router.refresh();
          });
        }}
      />
    </>
  );
}
