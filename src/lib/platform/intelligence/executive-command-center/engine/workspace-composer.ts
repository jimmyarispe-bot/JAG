/**
 * Compose role-prioritized widgets from soft-read domain lights (Sprint 068).
 */

import type { ProjectorInput } from "@/lib/platform/intelligence/executive-command-center/widgets/projectors";
import { WIDGET_PROJECTORS } from "@/lib/platform/intelligence/executive-command-center/widgets/projectors";
import type {
  WorkspaceLayout,
  WorkspaceWidget,
} from "@/lib/platform/intelligence/executive-command-center/types";

export class WorkspaceComposer {
  compose(layout: WorkspaceLayout, input: ProjectorInput): WorkspaceWidget[] {
    return layout.widgetOrder.map((kind, index) => {
      const projector = WIDGET_PROJECTORS[kind];
      const widget = projector(input);
      return { ...widget, priority: index + 1 };
    });
  }
}
