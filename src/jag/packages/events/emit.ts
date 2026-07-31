import type {
  PackageEvent,
  PackageEventType,
  PackageId,
} from "@/jag/packages/contracts/definitions";

let sequence = 0;
const listeners = new Set<(e: PackageEvent) => void>();
const history: PackageEvent[] = [];

export function subscribePackageEvents(
  listener: (e: PackageEvent) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitPackageEvent(input: {
  type: PackageEventType;
  packageId: PackageId;
  occurredAt: string;
  data?: Readonly<Record<string, unknown>>;
}): PackageEvent {
  sequence += 1;
  const event: PackageEvent = Object.freeze({
    id: `pkg_evt_${sequence}`,
    type: input.type,
    packageId: input.packageId,
    occurredAt: input.occurredAt,
    data: input.data ? Object.freeze({ ...input.data }) : undefined,
  });
  history.push(event);
  for (const listener of listeners) listener(event);
  return event;
}

export function listPackageEvents(filter?: {
  packageId?: string;
}): readonly PackageEvent[] {
  if (!filter?.packageId) return history;
  return history.filter((e) => e.packageId === filter.packageId);
}

export function resetPackageEventsForTests(): void {
  listeners.clear();
  history.length = 0;
  sequence = 0;
}
