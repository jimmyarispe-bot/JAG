/**
 * Executive Command Center — Sprint 068 / 0.1.0
 *
 * Single executive workspace. Widgets consume existing domain soft-reads.
 * Role layouts prioritize the same platform differently. No domain logic duplication.
 *
 * Distinct from legacy `src/lib/executive/command-center.ts` and Mission Control.
 *
 * Module id: executive-command-center
 * Hard DAG predecessor: executive-copilot
 */

export * from "@/lib/platform/intelligence/executive-command-center/types";
export * from "@/lib/platform/intelligence/executive-command-center/actions/drill-downs";
export * from "@/lib/platform/intelligence/executive-command-center/layouts";
export * from "@/lib/platform/intelligence/executive-command-center/widgets/projectors";
export * from "@/lib/platform/intelligence/executive-command-center/engine/layout-engine";
export * from "@/lib/platform/intelligence/executive-command-center/engine/refresh-engine";
export * from "@/lib/platform/intelligence/executive-command-center/engine/workspace-composer";
export * from "@/lib/platform/intelligence/executive-command-center/engine/command-center-engine";
export * from "@/lib/platform/intelligence/executive-command-center/services/command-center-service";

import { CommandCenterEngine } from "@/lib/platform/intelligence/executive-command-center/engine/command-center-engine";
import {
  ExecutiveCommandCenterService,
  type CommandCenterServiceDependencies,
} from "@/lib/platform/intelligence/executive-command-center/services/command-center-service";

export interface ExecutiveCommandCenterStack {
  service: ExecutiveCommandCenterService;
  engine: CommandCenterEngine;
}

export interface CreateExecutiveCommandCenterOptions
  extends CommandCenterServiceDependencies {}

export function createExecutiveCommandCenter(
  options: CreateExecutiveCommandCenterOptions = {}
): ExecutiveCommandCenterStack {
  const engine =
    options.engine ??
    new CommandCenterEngine({
      createId: options.createId,
      now: options.now,
    });
  const service = new ExecutiveCommandCenterService({ ...options, engine });
  return { service, engine };
}

export const createExecutiveCommandCenterIntelligence = createExecutiveCommandCenter;
