/**
 * Role → layout resolution (Sprint 068).
 */

import { getLayoutForRole } from "@/lib/platform/intelligence/executive-command-center/layouts";
import type {
  CommandCenterRole,
  WorkspaceLayout,
} from "@/lib/platform/intelligence/executive-command-center/types";

export class LayoutEngine {
  resolve(role: CommandCenterRole = "ceo"): WorkspaceLayout {
    return getLayoutForRole(role);
  }
}
