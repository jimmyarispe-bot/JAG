import type { ConnectorStatus } from "@/lib/connectors/types";

const ALLOWED: Readonly<Record<ConnectorStatus, readonly ConnectorStatus[]>> =
  Object.freeze({
    "Not Installed": Object.freeze(["Installed"] as const),
    Installed: Object.freeze([
      "Connected",
      "Disconnected",
      "Disabled",
      "Error",
    ] as const),
    Connected: Object.freeze([
      "Syncing",
      "Disconnected",
      "Disabled",
      "Error",
    ] as const),
    Disconnected: Object.freeze([
      "Connected",
      "Installed",
      "Disabled",
      "Error",
    ] as const),
    Syncing: Object.freeze([
      "Connected",
      "Error",
      "Disconnected",
      "Disabled",
    ] as const),
    Disabled: Object.freeze(["Installed", "Connected", "Disconnected"] as const),
    Error: Object.freeze([
      "Installed",
      "Connected",
      "Disconnected",
      "Disabled",
      "Syncing",
    ] as const),
  });

export function canTransitionConnectorStatus(
  from: ConnectorStatus,
  to: ConnectorStatus
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function transitionConnectorStatus(
  from: ConnectorStatus,
  to: ConnectorStatus
): ConnectorStatus {
  if (!canTransitionConnectorStatus(from, to)) {
    throw new Error(`Invalid connector status transition: ${from} → ${to}`);
  }
  return to;
}
