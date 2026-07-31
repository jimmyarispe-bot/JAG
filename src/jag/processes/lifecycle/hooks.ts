import type { ProcessContext } from "@/jag/processes/contracts/definitions";

export type LifecycleHookName =
  | "BeforeProcessStart"
  | "AfterProcessStart"
  | "BeforeStageEnter"
  | "AfterStageEnter"
  | "BeforeStageExit"
  | "AfterStageExit"
  | "BeforeTransition"
  | "AfterTransition"
  | "BeforeProcessComplete"
  | "AfterProcessComplete";

export type LifecycleHookHandler = (input: {
  hook: LifecycleHookName;
  context: ProcessContext;
  stageId?: string;
  transitionId?: string;
  data?: Readonly<Record<string, unknown>>;
}) => void | Promise<void>;

type HookBucket = Map<LifecycleHookName, LifecycleHookHandler[]>;

const hooks: HookBucket = new Map();

export function registerLifecycleHook(
  name: LifecycleHookName,
  handler: LifecycleHookHandler
): () => void {
  const list = hooks.get(name) ?? [];
  list.push(handler);
  hooks.set(name, list);
  return () => {
    const current = hooks.get(name) ?? [];
    hooks.set(
      name,
      current.filter((h) => h !== handler)
    );
  };
}

export async function runLifecycleHooks(
  name: LifecycleHookName,
  input: {
    context: ProcessContext;
    stageId?: string;
    transitionId?: string;
    data?: Readonly<Record<string, unknown>>;
  }
): Promise<void> {
  const list = hooks.get(name) ?? [];
  for (const handler of list) {
    await handler({ hook: name, ...input });
  }
}

export function listLifecycleHookNames(): LifecycleHookName[] {
  return [
    "BeforeProcessStart",
    "AfterProcessStart",
    "BeforeStageEnter",
    "AfterStageEnter",
    "BeforeStageExit",
    "AfterStageExit",
    "BeforeTransition",
    "AfterTransition",
    "BeforeProcessComplete",
    "AfterProcessComplete",
  ];
}

export function resetLifecycleHooksForTests(): void {
  hooks.clear();
}
