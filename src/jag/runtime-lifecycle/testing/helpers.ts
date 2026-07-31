import {
  resetHistorySequenceForTests,
} from "@/jag/runtime-lifecycle/history";
import {
  resetRollbackSequenceForTests,
} from "@/jag/runtime-lifecycle/rollback";
import {
  resetSnapshotSequenceForTests,
} from "@/jag/runtime-lifecycle/snapshots";
import {
  resetRuntimeVersionSequenceForTests,
} from "@/jag/runtime-lifecycle/versioning";
import { RuntimeLifecycleManager } from "@/jag/runtime-lifecycle/manager";

export function resetRuntimeLifecycleForTests(
  manager?: RuntimeLifecycleManager
): void {
  resetRuntimeVersionSequenceForTests();
  resetSnapshotSequenceForTests();
  resetRollbackSequenceForTests();
  resetHistorySequenceForTests();
  manager?.clear();
}

export function createTestLifecycleManager(
  clockStart = "2026-07-21T12:00:00.000Z"
): {
  manager: RuntimeLifecycleManager;
  advance: (ms: number) => void;
} {
  let t = Date.parse(clockStart);
  const manager = new RuntimeLifecycleManager({
    now: () => new Date(t).toISOString(),
  });
  return {
    manager,
    advance: (ms: number) => {
      t += ms;
    },
  };
}
