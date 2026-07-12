import type { OiosRepository, OiosService as Contract } from "@/lib/platform/oios/contracts";
import { OrganizationOperatingSystem } from "@/lib/platform/oios/organization-operating-system";
import type { OiosQueryRequest, OiosQueryResult, OiosRequest, OiosResult, OiosScope, OiosHistoryRecord } from "@/lib/platform/oios/types";
export class OiosService implements Contract {
  constructor(private readonly operatingSystem: OrganizationOperatingSystem, private readonly repository: OiosRepository) {}
  build(request: OiosRequest): OiosResult { return this.operatingSystem.build(request); }
  query(result: OiosResult, request: OiosQueryRequest): OiosQueryResult { return this.operatingSystem.query(result, request); }
  history(scope?: Partial<OiosScope>): OiosHistoryRecord[] { return this.repository.listHistory(scope); }
}
