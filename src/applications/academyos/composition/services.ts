import {
  AcademyContainerNotReadyError,
} from "@/applications/academyos/composition/errors";
import type {
  AcademyApplicationServices,
  AcademyContainer,
  AcademyServiceName,
} from "@/applications/academyos/composition/types";
import { ensureAcademyOSBooted } from "@/applications/academyos/runtime/boot";

let activeContainer: AcademyContainer | null = null;

export function setActiveAcademyContainer(container: AcademyContainer | null): void {
  activeContainer = container;
}

export function getActiveAcademyContainer(): AcademyContainer | null {
  return activeContainer;
}

export function requireAcademyContainer(): AcademyContainer {
  if (!activeContainer?.ready) {
    // Idempotent process boot (starter bound when composition/bootstrap is loaded).
    ensureAcademyOSBooted();
  }
  if (!activeContainer?.ready) {
    throw new AcademyContainerNotReadyError();
  }
  return activeContainer;
}

/**
 * Resolve a registered application service from the composition root.
 * @deprecated Prefer `resolveJAGService` from `@/jag` (delegates here during Sprint 002).
 */
export function resolveAcademyService<K extends AcademyServiceName>(
  name: K
): AcademyApplicationServices[K] {
  return requireAcademyContainer().services[name];
}

export function listAcademyServiceNames(): AcademyServiceName[] {
  return [
    "admissions",
    "students",
    "academics",
    "attendance",
    "finance",
    "hr",
    "communications",
    "administration",
  ];
}
