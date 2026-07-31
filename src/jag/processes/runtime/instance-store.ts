import type {
  ProcessInstance,
  ProcessInstanceId,
  ProcessSnapshot,
} from "@/jag/processes/contracts/definitions";
import { nextProcessOpaqueId } from "@/jag/processes/runtime/ids";

const instances = new Map<ProcessInstanceId, ProcessInstance>();
/** Insertion-ordered snapshot log (unique keys even when clock is frozen). */
const snapshots = new Map<string, ProcessSnapshot>();

export function putProcessInstance(instance: ProcessInstance): void {
  instances.set(instance.id, instance);
}

export function getProcessInstance(
  instanceId: ProcessInstanceId
): ProcessInstance | null {
  return instances.get(instanceId) ?? null;
}

export function listProcessInstances(filter?: {
  definitionId?: string;
  organizationId?: string;
  status?: ProcessInstance["status"];
}): ProcessInstance[] {
  let all = [...instances.values()];
  if (filter?.definitionId) {
    all = all.filter((i) => i.definitionId === filter.definitionId);
  }
  if (filter?.organizationId) {
    all = all.filter((i) => i.organizationId === filter.organizationId);
  }
  if (filter?.status) {
    all = all.filter((i) => i.status === filter.status);
  }
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

export function putProcessSnapshot(snapshot: ProcessSnapshot): string {
  const key = nextProcessOpaqueId("snap");
  snapshots.set(key, snapshot);
  return key;
}

export function getProcessSnapshot(key: string): ProcessSnapshot | null {
  return snapshots.get(key) ?? null;
}

export function listProcessSnapshots(
  instanceId: ProcessInstanceId
): ProcessSnapshot[] {
  // Preserve insertion order so frozen-clock tests can restore earlier snapshots.
  return [...snapshots.values()].filter((s) => s.instanceId === instanceId);
}

export function resetProcessInstanceStoreForTests(): void {
  instances.clear();
  snapshots.clear();
}
