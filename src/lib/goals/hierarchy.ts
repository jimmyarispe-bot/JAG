/**
 * GoalHierarchy — Vision → Strategic Goals → Objectives → Key Results → Initiatives → Projects → Tasks
 */

import { getGoal, listGoalsForOrganization } from "@/lib/goals/store";
import type {
  GoalHierarchyLevel,
  GoalType,
  JagGoal,
} from "@/lib/goals/types";

const LEVEL_ORDER: readonly GoalHierarchyLevel[] = [
  "Vision",
  "Strategic Goal",
  "Objective",
  "Key Result",
  "Initiative",
  "Project",
  "Task",
];

const TYPE_TO_LEVEL: Readonly<Record<GoalType, GoalHierarchyLevel>> = {
  "Strategic Goal": "Strategic Goal",
  Objective: "Objective",
  "Key Result": "Key Result",
  Initiative: "Initiative",
  "Project Goal": "Project",
  "Compliance Goal": "Strategic Goal",
};

const ALLOWED_CHILD: Readonly<
  Record<GoalHierarchyLevel, readonly GoalHierarchyLevel[]>
> = {
  Vision: ["Strategic Goal"],
  "Strategic Goal": ["Objective", "Initiative"],
  Objective: ["Key Result", "Initiative"],
  "Key Result": ["Initiative", "Project"],
  Initiative: ["Project", "Task"],
  Project: ["Task"],
  Task: [],
};

export type GoalHierarchyService = {
  levelForType(goalType: GoalType): GoalHierarchyLevel;
  levelIndex(level: GoalHierarchyLevel): number;
  canLink(parentLevel: GoalHierarchyLevel, childLevel: GoalHierarchyLevel): boolean;
  validateParent(
    organizationId: string,
    parentGoalId: string | null,
    childLevel: GoalHierarchyLevel
  ): { readonly ok: true } | { readonly ok: false; readonly error: string };
  children(organizationId: string, parentGoalId: string): readonly JagGoal[];
  ancestors(organizationId: string, goalId: string): readonly JagGoal[];
  subtree(organizationId: string, rootGoalId: string): readonly JagGoal[];
  nextLevels(level: GoalHierarchyLevel): readonly GoalHierarchyLevel[];
};

export function createGoalHierarchy(): GoalHierarchyService {
  return {
    levelForType(goalType) {
      return TYPE_TO_LEVEL[goalType];
    },
    levelIndex(level) {
      return LEVEL_ORDER.indexOf(level);
    },
    canLink(parentLevel, childLevel) {
      return ALLOWED_CHILD[parentLevel].includes(childLevel);
    },
    validateParent(organizationId, parentGoalId, childLevel) {
      if (!parentGoalId) return { ok: true };
      const parent = getGoal(organizationId, parentGoalId);
      if (!parent) {
        return { ok: false, error: "Parent goal was not found." };
      }
      if (!this.canLink(parent.hierarchyLevel, childLevel)) {
        return {
          ok: false,
          error: `Cannot place ${childLevel} under ${parent.hierarchyLevel}.`,
        };
      }
      return { ok: true };
    },
    children(organizationId, parentGoalId) {
      return Object.freeze(
        listGoalsForOrganization(organizationId).filter(
          (g) => g.parentGoalId === parentGoalId
        )
      );
    },
    ancestors(organizationId, goalId) {
      const chain: JagGoal[] = [];
      let current = getGoal(organizationId, goalId);
      const seen = new Set<string>();
      while (current?.parentGoalId) {
        if (seen.has(current.parentGoalId)) break;
        seen.add(current.parentGoalId);
        const parent = getGoal(organizationId, current.parentGoalId);
        if (!parent) break;
        chain.push(parent);
        current = parent;
      }
      return Object.freeze(chain);
    },
    subtree(organizationId, rootGoalId) {
      const root = getGoal(organizationId, rootGoalId);
      if (!root) return Object.freeze([]);
      const out: JagGoal[] = [root];
      const queue = [rootGoalId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        for (const child of this.children(organizationId, id)) {
          out.push(child);
          queue.push(child.id);
        }
      }
      return Object.freeze(out);
    },
    nextLevels(level) {
      return ALLOWED_CHILD[level];
    },
  };
}
