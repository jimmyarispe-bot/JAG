/**
 * Persistence contracts only — no SQL, no Supabase, no drivers in this sprint.
 */

import type {
  ProcessEvent,
  ProcessInstance,
  ProcessInstanceId,
  ProcessSnapshot,
} from "@/jag/processes/contracts/definitions";

export type ProcessRepository = {
  readonly save: (instance: ProcessInstance) => Promise<void>;
  readonly findById: (
    instanceId: ProcessInstanceId
  ) => Promise<ProcessInstance | null>;
  readonly listByOrganization: (
    organizationId: string
  ) => Promise<readonly ProcessInstance[]>;
};

export type ProcessSnapshotRepository = {
  readonly save: (snapshot: ProcessSnapshot) => Promise<void>;
  readonly findLatest: (
    instanceId: ProcessInstanceId
  ) => Promise<ProcessSnapshot | null>;
  readonly list: (
    instanceId: ProcessInstanceId
  ) => Promise<readonly ProcessSnapshot[]>;
};

export type ProcessEventRepository = {
  readonly append: (event: ProcessEvent) => Promise<void>;
  readonly list: (
    instanceId: ProcessInstanceId
  ) => Promise<readonly ProcessEvent[]>;
};

export type ProcessPersistencePorts = {
  readonly processes?: ProcessRepository;
  readonly snapshots?: ProcessSnapshotRepository;
  readonly events?: ProcessEventRepository;
};
