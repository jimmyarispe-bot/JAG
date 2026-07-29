import { describe, expect, it, vi } from "vitest";
import {
  createJagRuntime,
  RUNTIME_KERNEL_EVENT_TYPES,
  RUNTIME_PIPELINE_STAGE_IDS,
  RuntimeAuthorizationError,
  RuntimeContextError,
  RuntimeError,
  RuntimeExtensionError,
  RuntimeFatalError,
  RuntimeIntentError,
  RuntimeRecoverableError,
  type RuntimePipelineStage,
  type RuntimeResult,
} from "@/lib/jag/runtime";

describe("JAG Runtime Kernel", () => {
  describe("lifecycle", () => {
    it("creates a runtime in created state", () => {
      const rt = createJagRuntime({ runtimeId: "jag_test" });
      expect(rt.id).toBe("jag_test");
      expect(rt.state).toBe("created");
      expect(rt.registry).toBeDefined();
      expect(rt.events).toBeDefined();
      expect(rt.pipeline).toBeDefined();
      expect(rt.telemetry).toBeDefined();
    });

    it("starts and becomes ready", async () => {
      const rt = createJagRuntime();
      const lifecycle: string[] = [];
      rt.telemetry.subscribe((e) => {
        if (e.type === "runtime.lifecycle" && e.lifecycle) {
          lifecycle.push(e.lifecycle);
        }
      });
      await rt.start();
      expect(rt.state).toBe("ready");
      expect(lifecycle).toContain("starting");
      expect(lifecycle).toContain("ready");
    });

    it("auto-starts on run", async () => {
      const rt = createJagRuntime();
      const result = await rt.run({ composeOnly: true });
      expect(result.status).toBe("completed");
      expect(rt.state).toBe("ready");
    });

    it("stops and refuses further runs", async () => {
      const rt = createJagRuntime();
      await rt.start();
      await rt.stop();
      expect(rt.state).toBe("stopped");
      await expect(rt.run()).rejects.toThrow(/Cannot run pipeline/);
    });
  });

  describe("pipeline execution", () => {
    it("executes the canonical stage order for composeOnly", async () => {
      const rt = createJagRuntime();
      const result = await rt.run({
        composeOnly: true,
        trigger: { kind: "test" },
      });

      expect(result.status).toBe("completed");
      expect(result.correlationId).toMatch(/^corr_/);
      const completed = result.stages
        .filter((s) => s.status === "completed")
        .map((s) => s.stageId);
      expect(completed).toEqual([
        "identity",
        "context",
        "intent",
        "cognition",
        "experience",
      ]);
      const skipped = result.stages
        .filter((s) => s.status === "skipped")
        .map((s) => s.stageId);
      expect(skipped).toEqual([
        "action",
        "domain",
        "evidence",
        "memory",
        "twin",
      ]);
    });

    it("runs all stages when not composeOnly", async () => {
      const rt = createJagRuntime();
      const result = await rt.run();
      expect(result.status).toBe("completed");
      expect(result.stages.map((s) => s.stageId)).toEqual([
        ...RUNTIME_PIPELINE_STAGE_IDS,
      ]);
      expect(result.stages.every((s) => s.status === "completed")).toBe(true);
    });

    it("supports stopAfter", async () => {
      const rt = createJagRuntime();
      const result = await rt.run({ stopAfter: "intent" });
      expect(result.stages.map((s) => s.stageId)).toEqual([
        "identity",
        "context",
        "intent",
      ]);
    });

    it("allows registered stages to mutate execution state", async () => {
      const rt = createJagRuntime();
      const identityStage: RuntimePipelineStage = {
        id: "identity",
        order: 10,
        execute(ctx) {
          ctx.setIdentity({
            principalId: "p1",
            effectiveUserId: "u1",
            roles: ["member"],
            permissions: ["read"],
            orgAssignments: [{ organizationId: "org1" }],
            activeOrganizationId: "org1",
            issuedAt: new Date().toISOString(),
          });
        },
      };
      rt.registry.registerPipelineStage(identityStage);
      const result = await rt.run({ composeOnly: true });
      expect(result.identity?.effectiveUserId).toBe("u1");
      expect(result.identity?.activeOrganizationId).toBe("org1");
    });
  });

  describe("stage registration", () => {
    it("overrides default skeleton stages", async () => {
      const rt = createJagRuntime();
      let called = false;
      rt.registry.registerPipelineStage({
        id: "cognition",
        execute(ctx) {
          called = true;
          ctx.setCognition({ summary: "none", unknownGaps: [] });
        },
      });
      const result = await rt.run({ stopAfter: "cognition" });
      expect(called).toBe(true);
      expect(result.cognition).toEqual({
        summary: "none",
        unknownGaps: [],
      });
    });
  });

  describe("event publication", () => {
    it("publishes pipeline lifecycle events in order", async () => {
      const rt = createJagRuntime();
      const types: string[] = [];
      rt.events.subscribe("*", (e) => {
        types.push(e.eventType);
      });
      await rt.run({ composeOnly: true, stopAfter: "identity" });
      expect(types).toContain(RUNTIME_KERNEL_EVENT_TYPES.RUNTIME_STARTED);
      expect(types).toContain(RUNTIME_KERNEL_EVENT_TYPES.PIPELINE_STARTED);
      expect(types).toContain(RUNTIME_KERNEL_EVENT_TYPES.STAGE_STARTED);
      expect(types).toContain(RUNTIME_KERNEL_EVENT_TYPES.STAGE_COMPLETED);
      expect(types).toContain(RUNTIME_KERNEL_EVENT_TYPES.PIPELINE_COMPLETED);
    });

    it("supports priority ordering and middleware", async () => {
      const rt = createJagRuntime();
      const order: string[] = [];
      rt.events.use(async (event, next) => {
        order.push("mw-before");
        await next(event);
        order.push("mw-after");
      });
      rt.events.subscribe(
        "test.event",
        () => {
          order.push("low");
        },
        { priority: 1 }
      );
      rt.events.subscribe(
        "test.event",
        () => {
          order.push("high");
        },
        { priority: 10 }
      );
      await rt.events.publish("test.event", { ok: true });
      expect(order).toEqual(["mw-before", "high", "low", "mw-after"]);
    });

    it("unsubscribes listeners", async () => {
      const rt = createJagRuntime();
      const handler = vi.fn();
      const unsub = rt.events.subscribe("x", handler);
      unsub();
      await rt.events.publish("x", {});
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("extension registration", () => {
    it("registers and unregisters extensions", async () => {
      const rt = createJagRuntime();
      const hooks = { register: 0, unregister: 0 };
      await rt.registry.registerExtension({
        id: "ext.sample",
        kind: "generic",
        onRegister() {
          hooks.register += 1;
        },
        onUnregister() {
          hooks.unregister += 1;
        },
      });
      expect(rt.registry.getExtension("ext.sample")?.kind).toBe("generic");
      await rt.registry.unregisterExtension("ext.sample");
      expect(rt.registry.getExtension("ext.sample")).toBeUndefined();
      expect(hooks).toEqual({ register: 1, unregister: 1 });
    });

    it("registers domain packages without hard-coding education", () => {
      const rt = createJagRuntime();
      rt.registry.registerDomainPackage({
        id: "example.pack",
        name: "Example",
        version: "0.0.1",
      });
      expect(rt.registry.listDomainPackages()).toHaveLength(1);
      expect(rt.registry.listDomainPackages()[0]?.id).toBe("example.pack");
    });

    it("rejects duplicate extension ids", async () => {
      const rt = createJagRuntime();
      await rt.registry.registerExtension({
        id: "dup",
        kind: "generic",
      });
      await expect(
        rt.registry.registerExtension({ id: "dup", kind: "generic" })
      ).rejects.toBeInstanceOf(RuntimeExtensionError);
    });

    it("registers experience and action providers", async () => {
      const rt = createJagRuntime();
      rt.registry.registerExperienceProvider({
        id: "exp.default",
        compose() {
          return {
            workspaceId: "ws1",
            contextId: "ctx1",
            widgetIds: [],
            commandEnabled: true,
            searchEnabled: true,
          };
        },
      });
      rt.registry.registerActionProvider({
        id: "act.echo",
        actionIds: ["echo"],
        execute(request) {
          return {
            actionId: request.actionId,
            status: "succeeded",
          };
        },
      });

      const result = await rt.run({
        initialData: { actionId: "echo" },
      });
      expect(result.experience?.workspaceId).toBe("ws1");
      expect(result.action?.status).toBe("succeeded");
    });
  });

  describe("failure propagation", () => {
    it("fails the pipeline on fatal stage errors", async () => {
      const rt = createJagRuntime();
      rt.registry.registerPipelineStage({
        id: "identity",
        execute() {
          throw new RuntimeFatalError("no identity", {
            code: "NO_IDENTITY",
            stageId: "identity",
          });
        },
      });
      const result = await rt.run({ composeOnly: true });
      expect(result.status).toBe("failed");
      expect(result.error?.code).toBe("NO_IDENTITY");
      expect(result.stages[0]?.status).toBe("failed");
      expect(result.stages.length).toBe(1);
    });

    it("continues optional stages on recoverable errors", async () => {
      const rt = createJagRuntime();
      rt.registry.registerPipelineStage({
        id: "action",
        optional: true,
        execute() {
          throw new RuntimeRecoverableError("action skipped", {
            stageId: "action",
          });
        },
      });
      const result = await rt.run();
      expect(result.status).toBe("completed");
      const actionOutcome = result.stages.find((s) => s.stageId === "action");
      expect(actionOutcome?.status).toBe("failed");
      expect(
        result.stages.find((s) => s.stageId === "twin")?.status
      ).toBe("completed");
    });

    it("supports cancellation via cancel()", async () => {
      const rt = createJagRuntime();
      let cancelInvoked = false;
      rt.registry.registerPipelineStage({
        id: "identity",
        async execute(ctx) {
          cancelInvoked = true;
          rt.cancel();
          ctx.throwIfCancelled();
        },
      });
      const result = await rt.run({ composeOnly: true });
      expect(cancelInvoked).toBe(true);
      expect(result.status).toBe("cancelled");
    });
  });

  describe("error hierarchy", () => {
    it("exposes typed runtime errors", () => {
      expect(new RuntimeAuthorizationError("x")).toBeInstanceOf(RuntimeError);
      expect(new RuntimeContextError("x").stageId).toBe("context");
      expect(new RuntimeIntentError("x").recoverable).toBe(true);
      expect(new RuntimeFatalError("x").recoverable).toBe(false);
    });
  });

  describe("type safety / result shape", () => {
    it("returns a well-formed RuntimeResult", async () => {
      const rt = createJagRuntime();
      const result: RuntimeResult = await rt.run({ composeOnly: true });
      expect(typeof result.correlationId).toBe("string");
      expect(typeof result.durationMs).toBe("number");
      expect(Array.isArray(result.stages)).toBe(true);
      expect(result.data).toEqual({});
    });
  });
});
