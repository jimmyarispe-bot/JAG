export type DomainActor = {
  userId: string;
  displayName?: string | null;
  permissions: ReadonlySet<string> | readonly string[];
};

export type LifecycleStatus =
  | "draft"
  | "pending"
  | "active"
  | "archived"
  | "closed"
  | "cancelled";
