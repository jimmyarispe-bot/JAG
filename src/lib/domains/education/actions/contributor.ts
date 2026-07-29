/**
 * Education Action contributor — catalog registration only.
 * execute returns skipped; no domain mutations in D1.
 */

import type { ActionContributor } from "@/lib/jag/runtime";
import {
  EDUCATION_ACTION_IDS,
  EDUCATION_CONTRIBUTOR_IDS,
} from "../types";
import {
  EDUCATION_ACTION_CATALOG,
  EDUCATION_ACTION_NOT_IMPLEMENTED,
} from "./contracts";

export function createEducationActionContributor(): ActionContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.action,
    priority: 10,
    actionIds: Object.values(EDUCATION_ACTION_IDS),
    catalog: EDUCATION_ACTION_CATALOG,
    execute() {
      return {
        status: "skipped",
        domainPackageId: "education",
        error: { ...EDUCATION_ACTION_NOT_IMPLEMENTED },
      };
    },
  };
}
