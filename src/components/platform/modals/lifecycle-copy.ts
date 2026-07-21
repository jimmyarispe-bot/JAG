import { DELETE_CONFIRMATION_TOKEN } from "@/lib/platform/crud";

export type LifecycleConfirmAction = "archive" | "delete" | "restore";

export function lifecycleModalTitle(
  action: LifecycleConfirmAction,
  entityLabel: string
): string {
  switch (action) {
    case "archive":
      return `Archive ${entityLabel}`;
    case "delete":
      return `Permanently Delete ${entityLabel}`;
    case "restore":
      return `Restore ${entityLabel}`;
  }
}

export function lifecycleConfirmLabel(
  action: LifecycleConfirmAction,
  entityLabel: string
): string {
  switch (action) {
    case "archive":
      return `Archive ${entityLabel}`;
    case "delete":
      return `Delete ${entityLabel}`;
    case "restore":
      return `Restore ${entityLabel}`;
  }
}

export function lifecycleModalBody(
  action: LifecycleConfirmAction,
  entityLabel: string
): string[] {
  const entity = entityLabel.toLowerCase();
  switch (action) {
    case "archive":
      return [
        `Archiving removes the ${entity} from active records while preserving all historical data.`,
        `The ${entity} can be restored later.`,
      ];
    case "delete":
      return [
        `This action permanently deletes this ${entity}.`,
        "This cannot be undone.",
        entity === "student"
          ? "Only students with no dependent records can be permanently deleted."
          : `Only ${entity} records with no dependent records can be permanently deleted.`,
      ];
    case "restore":
      return [`This ${entity} will be returned to Active status.`];
  }
}

export function canSubmitLifecycleDelete(
  acknowledged: boolean,
  confirmationText: string,
  pending = false
): boolean {
  return (
    acknowledged &&
    confirmationText === DELETE_CONFIRMATION_TOKEN &&
    !pending
  );
}

export { DELETE_CONFIRMATION_TOKEN };
