import { ACADEMYOS_ENDPOINTS } from "@/applications/academyos/api/endpoints";
import { ApiService } from "@/lib/platform/api";
import type { PlatformEndpoint } from "@/lib/platform/api";

/**
 * Register API endpoint contracts.
 * Handlers are intentionally omitted — routing adapters come later.
 */
export function registerAcademyApis(): PlatformEndpoint[] {
  return ACADEMYOS_ENDPOINTS.map((ep) => ApiService.register(ep));
}

export { ACADEMYOS_ENDPOINTS } from "@/applications/academyos/api/endpoints";
export {
  ACADEMYOS_API_CATALOG,
  listAcademyApiCatalog,
  type AcademyApiCatalogEntry,
} from "@/applications/academyos/api/catalog";
