/**
 * Intelligence Platform Infrastructure — IntelligenceRegistry (Sprint 027).
 *
 * Automatic registration + dependency-ordered resolution (topological sort).
 */

import type {
  IntelligenceModule,
  IntelligenceRegistry as IntelligenceRegistryContract,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type { IntelligenceModuleId } from "@/lib/platform/intelligence/infrastructure/types";

export class IntelligenceRegistryError extends Error {
  readonly code:
    | "DUPLICATE_MODULE"
    | "UNKNOWN_MODULE"
    | "MISSING_DEPENDENCY"
    | "CYCLIC_DEPENDENCY"
    | "INVALID_MODULE";
  readonly moduleId: string | null;

  constructor(options: {
    code: IntelligenceRegistryError["code"];
    message: string;
    moduleId?: string | null;
  }) {
    super(options.message);
    this.name = "IntelligenceRegistryError";
    this.code = options.code;
    this.moduleId = options.moduleId ?? null;
  }
}

function assertModule(domainModule: IntelligenceModule): void {
  if (!domainModule || typeof domainModule !== "object") {
    throw new IntelligenceRegistryError({
      code: "INVALID_MODULE",
      message: "Module candidate must be a non-null object",
    });
  }
  if (!domainModule.id || typeof domainModule.id !== "string") {
    throw new IntelligenceRegistryError({
      code: "INVALID_MODULE",
      message: "Module must declare a non-empty string id",
      moduleId: domainModule?.id ? String(domainModule.id) : null,
    });
  }
  if (!domainModule.name || typeof domainModule.name !== "string") {
    throw new IntelligenceRegistryError({
      code: "INVALID_MODULE",
      message: `Module "${domainModule.id}" must declare a name`,
      moduleId: domainModule.id,
    });
  }
  if (!domainModule.version || typeof domainModule.version !== "string") {
    throw new IntelligenceRegistryError({
      code: "INVALID_MODULE",
      message: `Module "${domainModule.id}" must declare a version`,
      moduleId: domainModule.id,
    });
  }
  if (typeof domainModule.execute !== "function") {
    throw new IntelligenceRegistryError({
      code: "INVALID_MODULE",
      message: `Module "${domainModule.id}" must implement execute()`,
      moduleId: domainModule.id,
    });
  }
  if (!Array.isArray(domainModule.dependencies)) {
    throw new IntelligenceRegistryError({
      code: "INVALID_MODULE",
      message: `Module "${domainModule.id}" must declare dependencies[]`,
      moduleId: domainModule.id,
    });
  }
}

/**
 * In-memory registry of platform intelligence modules.
 * Instance-scoped for dependency injection and test isolation.
 */
export class IntelligenceRegistryImpl implements IntelligenceRegistryContract {
  private readonly modules = new Map<string, IntelligenceModule>();

  register(domainModule: IntelligenceModule): void {
    assertModule(domainModule);
    if (this.modules.has(domainModule.id)) {
      throw new IntelligenceRegistryError({
        code: "DUPLICATE_MODULE",
        message: `Intelligence domainModule "${domainModule.id}" is already registered`,
        moduleId: domainModule.id,
      });
    }
    this.modules.set(domainModule.id, domainModule);
  }

  unregister(moduleId: IntelligenceModuleId): boolean {
    return this.modules.delete(moduleId);
  }

  get(moduleId: IntelligenceModuleId): IntelligenceModule | undefined {
    return this.modules.get(moduleId);
  }

  has(moduleId: IntelligenceModuleId): boolean {
    return this.modules.has(moduleId);
  }

  list(): IntelligenceModule[] {
    return [...this.modules.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, domainModule]) => domainModule);
  }

  ids(): IntelligenceModuleId[] {
    return this.list().map((domainModule) => domainModule.id);
  }

  size(): number {
    return this.modules.size;
  }

  clear(): void {
    this.modules.clear();
  }

  /**
   * Resolve dependency order via Kahn topological sort.
   * When `moduleIds` is provided, only those modules (plus their transitive deps) are included.
   */
  resolveOrder(moduleIds?: IntelligenceModuleId[]): IntelligenceModuleId[] {
    const targetIds =
      moduleIds && moduleIds.length > 0
        ? this.collectWithDependencies(moduleIds)
        : this.ids();

    for (const id of targetIds) {
      if (!this.modules.has(id)) {
        throw new IntelligenceRegistryError({
          code: "UNKNOWN_MODULE",
          message: `Unknown intelligence module "${id}"`,
          moduleId: id,
        });
      }
    }

    const targetSet = new Set(targetIds);
    const indegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const id of targetIds) {
      indegree.set(id, 0);
      adjacency.set(id, []);
    }

    for (const id of targetIds) {
      const domainModule = this.modules.get(id)!;
      for (const dep of domainModule.dependencies) {
        if (!this.modules.has(dep)) {
          throw new IntelligenceRegistryError({
            code: "MISSING_DEPENDENCY",
            message: `Module "${id}" depends on missing module "${dep}"`,
            moduleId: id,
          });
        }
        if (!targetSet.has(dep)) {
          continue;
        }
        adjacency.get(dep)!.push(id);
        indegree.set(id, (indegree.get(id) ?? 0) + 1);
      }
    }

    const queue = [...targetIds]
      .filter((id) => (indegree.get(id) ?? 0) === 0)
      .sort((a, b) => a.localeCompare(b));
    const ordered: IntelligenceModuleId[] = [];

    while (queue.length > 0) {
      const id = queue.shift()!;
      ordered.push(id);
      const next = (adjacency.get(id) ?? []).slice().sort((a, b) => a.localeCompare(b));
      for (const child of next) {
        const nextDegree = (indegree.get(child) ?? 0) - 1;
        indegree.set(child, nextDegree);
        if (nextDegree === 0) {
          queue.push(child);
          queue.sort((a, b) => a.localeCompare(b));
        }
      }
    }

    if (ordered.length !== targetIds.length) {
      const remaining = targetIds.filter((id) => !ordered.includes(id));
      throw new IntelligenceRegistryError({
        code: "CYCLIC_DEPENDENCY",
        message: `Cyclic dependency detected among modules: ${remaining.join(", ")}`,
        moduleId: remaining[0] ?? null,
      });
    }

    return ordered;
  }

  private collectWithDependencies(
    moduleIds: IntelligenceModuleId[]
  ): IntelligenceModuleId[] {
    const collected = new Set<string>();
    const visit = (id: IntelligenceModuleId): void => {
      if (collected.has(id)) return;
      if (!this.modules.has(id)) {
        throw new IntelligenceRegistryError({
          code: "UNKNOWN_MODULE",
          message: `Unknown intelligence module "${id}"`,
          moduleId: id,
        });
      }
      collected.add(id);
      const domainModule = this.modules.get(id)!;
      for (const dep of domainModule.dependencies) {
        visit(dep);
      }
    };
    for (const id of moduleIds) {
      visit(id);
    }
    return [...collected];
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceRegistryImpl as IntelligenceRegistry };

export function createIntelligenceRegistry(): IntelligenceRegistryImpl {
  return new IntelligenceRegistryImpl();
}
