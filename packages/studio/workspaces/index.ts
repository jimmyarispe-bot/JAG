/**
 * Studio Workspaces — unified entry points for each Studio surface.
 */

import { createArchitectureService } from "../architecture/analyzer";
import { createDocumentationService } from "../documentation/intelligence";
import { buildStudioDashboard } from "../insights/dashboard";
import { createPerEngine } from "../per/engine";
import { createProductRegistryService } from "../products/registry";
import { createReleaseManager } from "../release/manager";
import { createRepositoryService } from "../repository/scanner";
import { createTestingWorkspaceService } from "../testing/workspace";

export function createStudioWorkspaces(root?: string) {
  return {
    architecture: () => createArchitectureService().view(root),
    repository: () => createRepositoryService().scan(root),
    products: () => createProductRegistryService().list(),
    releases: () => createReleaseManager().list(),
    testing: () => createTestingWorkspaceService().view(root),
    pers: () => createPerEngine().list(),
    documentation: () => createDocumentationService().analyze(root),
    dashboard: () => buildStudioDashboard(root),
  };
}
