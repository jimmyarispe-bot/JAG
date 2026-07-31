export const WORK_PERMISSION_KEYS = Object.freeze({
  access: "work.access",
  typesRead: "work.types.read",
  typesUpdate: "work.types.update",
  itemsRead: "work.items.read",
  itemsUpdate: "work.items.update",
  assignmentsRead: "work.assignments.read",
  assignmentsUpdate: "work.assignments.update",
  dependenciesRead: "work.dependencies.read",
  dependenciesUpdate: "work.dependencies.update",
  scheduleLinksRead: "work.scheduleLinks.read",
  scheduleLinksUpdate: "work.scheduleLinks.update",
} as const);

export const WORK_PERMISSION_PACK_ID = "work.permission.core" as const;
