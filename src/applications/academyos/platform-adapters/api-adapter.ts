import { ApiService } from "@/lib/platform/api";
import {
  ACADEMYOS_API_CATALOG,
  listAcademyApiCatalog,
} from "@/applications/academyos/api/catalog";

/**
 * Isolates AcademyOS from API Framework implementation details.
 * Does not register handlers — contract discovery only for Phase 2.
 */
export const ApiPlatformAdapter = {
  listRegistered() {
    return ApiService.list().filter((e) => e.applicationId === "academyos");
  },

  get(endpointId: string) {
    return ApiService.get(endpointId);
  },

  catalog(status?: "registered" | "planned") {
    return listAcademyApiCatalog(status);
  },

  describe(endpointId: string) {
    return ApiService.describe(endpointId);
  },

  inventoryCount() {
    return {
      registered: ACADEMYOS_API_CATALOG.filter((e) => e.status === "registered").length,
      planned: ACADEMYOS_API_CATALOG.filter((e) => e.status === "planned").length,
    };
  },
};
