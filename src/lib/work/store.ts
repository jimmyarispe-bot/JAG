import type {
  JagDependency,
  JagInitiative,
  JagMilestone,
  JagProject,
  JagWorkItem,
  WorkTimelineEntry,
} from "@/lib/work/types";

type WorkStore = {
  workItems: Map<string, JagWorkItem>;
  projects: Map<string, JagProject>;
  initiatives: Map<string, JagInitiative>;
  milestones: Map<string, JagMilestone>;
  dependencies: Map<string, JagDependency>;
  timeline: WorkTimelineEntry[];
};

const g = globalThis as typeof globalThis & {
  __jagWorkStore?: WorkStore;
};

function store(): WorkStore {
  if (!g.__jagWorkStore) {
    g.__jagWorkStore = {
      workItems: new Map(),
      projects: new Map(),
      initiatives: new Map(),
      milestones: new Map(),
      dependencies: new Map(),
      timeline: [],
    };
  }
  return g.__jagWorkStore;
}

export function resetWorkStoreForTests(): void {
  g.__jagWorkStore = {
    workItems: new Map(),
    projects: new Map(),
    initiatives: new Map(),
    milestones: new Map(),
    dependencies: new Map(),
    timeline: [],
  };
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function upsertWorkItem(item: JagWorkItem): JagWorkItem {
  store().workItems.set(key(item.organizationId, item.id), item);
  return item;
}

export function getWorkItem(
  organizationId: string,
  workItemId: string
): JagWorkItem | null {
  return store().workItems.get(key(organizationId, workItemId)) ?? null;
}

export function listWorkItemsForOrganization(
  organizationId: string
): readonly JagWorkItem[] {
  return Object.freeze(
    [...store().workItems.values()]
      .filter((w) => w.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertProject(project: JagProject): JagProject {
  store().projects.set(key(project.organizationId, project.id), project);
  return project;
}

export function getProject(
  organizationId: string,
  projectId: string
): JagProject | null {
  return store().projects.get(key(organizationId, projectId)) ?? null;
}

export function listProjectsForOrganization(
  organizationId: string
): readonly JagProject[] {
  return Object.freeze(
    [...store().projects.values()]
      .filter((p) => p.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function upsertInitiative(initiative: JagInitiative): JagInitiative {
  store().initiatives.set(
    key(initiative.organizationId, initiative.id),
    initiative
  );
  return initiative;
}

export function listInitiativesForOrganization(
  organizationId: string
): readonly JagInitiative[] {
  return Object.freeze(
    [...store().initiatives.values()].filter(
      (i) => i.organizationId === organizationId
    )
  );
}

export function upsertMilestone(milestone: JagMilestone): JagMilestone {
  store().milestones.set(key(milestone.organizationId, milestone.id), milestone);
  return milestone;
}

export function getMilestone(
  organizationId: string,
  milestoneId: string
): JagMilestone | null {
  return store().milestones.get(key(organizationId, milestoneId)) ?? null;
}

export function listMilestonesForOrganization(
  organizationId: string,
  projectId?: string
): readonly JagMilestone[] {
  return Object.freeze(
    [...store().milestones.values()].filter(
      (m) =>
        m.organizationId === organizationId &&
        (projectId == null || m.projectId === projectId)
    )
  );
}

export function upsertDependency(dep: JagDependency): JagDependency {
  store().dependencies.set(key(dep.organizationId, dep.id), dep);
  return dep;
}

export function listDependenciesForOrganization(
  organizationId: string,
  workItemId?: string
): readonly JagDependency[] {
  return Object.freeze(
    [...store().dependencies.values()].filter(
      (d) =>
        d.organizationId === organizationId &&
        (workItemId == null ||
          d.fromWorkItemId === workItemId ||
          d.toWorkItemId === workItemId)
    )
  );
}

export function appendWorkTimeline(
  entry: WorkTimelineEntry
): WorkTimelineEntry {
  store().timeline.push(entry);
  if (store().timeline.length > 8000) {
    store().timeline = store().timeline.slice(-6000);
  }
  return entry;
}

export function listWorkTimeline(
  organizationId: string,
  entityId?: string
): readonly WorkTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (entityId == null || e.entityId === entityId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
