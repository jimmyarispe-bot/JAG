import { boardLayout } from "@/lib/platform/intelligence/executive-command-center/layouts/board";
import { ceoLayout } from "@/lib/platform/intelligence/executive-command-center/layouts/ceo";
import { founderLayout } from "@/lib/platform/intelligence/executive-command-center/layouts/founder";
import { missionControlLayout } from "@/lib/platform/intelligence/executive-command-center/layouts/mission-control";
import { schoolLeaderLayout } from "@/lib/platform/intelligence/executive-command-center/layouts/school-leader";
import type {
  CommandCenterRole,
  WorkspaceLayout,
} from "@/lib/platform/intelligence/executive-command-center/types";

const LAYOUTS: Record<CommandCenterRole, WorkspaceLayout> = {
  founder: founderLayout,
  ceo: ceoLayout,
  board: boardLayout,
  school_leader: schoolLeaderLayout,
  mission_control: missionControlLayout,
};

export function getLayoutForRole(role: CommandCenterRole): WorkspaceLayout {
  return LAYOUTS[role];
}

export function listLayouts(): WorkspaceLayout[] {
  return Object.values(LAYOUTS);
}

export {
  founderLayout,
  ceoLayout,
  boardLayout,
  schoolLeaderLayout,
  missionControlLayout,
};
