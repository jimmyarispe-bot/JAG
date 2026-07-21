"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import type { CommandCenterRole } from "@/lib/platform/intelligence/executive-command-center";
import { COMMAND_CENTER_ROLES } from "@/lib/platform/intelligence/executive-command-center";
import { cn } from "@/components/workspace-design-system/utils";

const LABELS: Record<CommandCenterRole, string> = {
  founder: "Founder",
  ceo: "CEO",
  board: "Board",
  school_leader: "School Leader",
  mission_control: "Mission Control",
};

export interface RoleLayoutSwitcherProps {
  role: CommandCenterRole;
  className?: string;
  onChange?: (role: CommandCenterRole) => void;
}

export function RoleLayoutSwitcher({
  role,
  className,
  onChange,
}: RoleLayoutSwitcherProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {COMMAND_CENTER_ROLES.map((r) => (
        <ActionChip
          key={r}
          size="sm"
          variant={r === role ? "primary" : "secondary"}
          onClick={() => onChange?.(r)}
        >
          {LABELS[r]}
        </ActionChip>
      ))}
    </div>
  );
}
