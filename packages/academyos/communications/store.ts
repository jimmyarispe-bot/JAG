import { DEFAULT_CHANNEL_ROUTING } from "./config";
import type {
  Announcement,
  ChannelRoutingConfig,
  CommunicationTemplate,
  Message,
  MessageThread,
  Notification,
  NotificationPreference,
  Reminder,
  WorkflowInstance,
} from "./types";

type CommunicationsStore = {
  routing: Map<string, ChannelRoutingConfig>;
  preferences: Map<string, NotificationPreference>;
  templates: Map<string, CommunicationTemplate>;
  notifications: Map<string, Notification>;
  threads: Map<string, MessageThread>;
  messages: Map<string, Message>;
  announcements: Map<string, Announcement>;
  workflows: Map<string, WorkflowInstance>;
  reminders: Map<string, Reminder>;
};

const g = globalThis as typeof globalThis & {
  __academyOsCommunicationsStore?: CommunicationsStore;
};

function empty(): CommunicationsStore {
  return {
    routing: new Map(),
    preferences: new Map(),
    templates: new Map(),
    notifications: new Map(),
    threads: new Map(),
    messages: new Map(),
    announcements: new Map(),
    workflows: new Map(),
    reminders: new Map(),
  };
}

function store(): CommunicationsStore {
  if (!g.__academyOsCommunicationsStore)
    g.__academyOsCommunicationsStore = empty();
  return g.__academyOsCommunicationsStore;
}

export function resetCommunicationsStoreForTests(): void {
  g.__academyOsCommunicationsStore = empty();
}

function key(organizationId: string, id: string): string {
  return `${organizationId}::${id}`;
}

export function getChannelRouting(
  organizationId: string
): ChannelRoutingConfig {
  return store().routing.get(organizationId) ?? DEFAULT_CHANNEL_ROUTING;
}

export function setChannelRouting(
  organizationId: string,
  config: ChannelRoutingConfig
): ChannelRoutingConfig {
  store().routing.set(organizationId, config);
  return config;
}

export function upsertPreference(
  p: NotificationPreference
): NotificationPreference {
  store().preferences.set(key(p.organizationId, p.id), p);
  return p;
}

export function listPreferences(
  organizationId: string,
  subjectId?: string
): NotificationPreference[] {
  return [...store().preferences.values()].filter(
    (p) =>
      p.organizationId === organizationId &&
      (!subjectId || p.subjectId === subjectId)
  );
}

export function findPreference(
  organizationId: string,
  subjectType: NotificationPreference["subjectType"],
  subjectId: string
): NotificationPreference | null {
  return (
    [...store().preferences.values()].find(
      (p) =>
        p.organizationId === organizationId &&
        p.subjectType === subjectType &&
        p.subjectId === subjectId
    ) ?? null
  );
}

export function upsertTemplate(
  t: CommunicationTemplate
): CommunicationTemplate {
  store().templates.set(key(t.organizationId, t.id), t);
  return t;
}

export function getTemplate(
  organizationId: string,
  id: string
): CommunicationTemplate | null {
  return store().templates.get(key(organizationId, id)) ?? null;
}

export function listTemplates(
  organizationId: string
): CommunicationTemplate[] {
  return [...store().templates.values()].filter(
    (t) => t.organizationId === organizationId
  );
}

export function findTemplateByKey(
  organizationId: string,
  templateKey: string
): CommunicationTemplate | null {
  return (
    listTemplates(organizationId).find(
      (t) => t.key === templateKey && t.status === "Published"
    ) ?? null
  );
}

export function upsertNotification(n: Notification): Notification {
  store().notifications.set(key(n.organizationId, n.id), n);
  return n;
}

export function getNotification(
  organizationId: string,
  id: string
): Notification | null {
  return store().notifications.get(key(organizationId, id)) ?? null;
}

export function listNotifications(
  organizationId: string
): Notification[] {
  return [...store().notifications.values()].filter(
    (n) => n.organizationId === organizationId
  );
}

export function upsertThread(t: MessageThread): MessageThread {
  store().threads.set(key(t.organizationId, t.id), t);
  return t;
}

export function getThread(
  organizationId: string,
  id: string
): MessageThread | null {
  return store().threads.get(key(organizationId, id)) ?? null;
}

export function listThreads(organizationId: string): MessageThread[] {
  return [...store().threads.values()].filter(
    (t) => t.organizationId === organizationId
  );
}

export function upsertMessage(m: Message): Message {
  store().messages.set(key(m.organizationId, m.id), m);
  return m;
}

export function listMessages(
  organizationId: string,
  threadId?: string
): Message[] {
  return [...store().messages.values()]
    .filter(
      (m) =>
        m.organizationId === organizationId &&
        (!threadId || m.threadId === threadId)
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function upsertAnnouncement(a: Announcement): Announcement {
  store().announcements.set(key(a.organizationId, a.id), a);
  return a;
}

export function getAnnouncement(
  organizationId: string,
  id: string
): Announcement | null {
  return store().announcements.get(key(organizationId, id)) ?? null;
}

export function listAnnouncements(organizationId: string): Announcement[] {
  return [...store().announcements.values()].filter(
    (a) => a.organizationId === organizationId
  );
}

export function upsertWorkflow(w: WorkflowInstance): WorkflowInstance {
  store().workflows.set(key(w.organizationId, w.id), w);
  return w;
}

export function getWorkflow(
  organizationId: string,
  id: string
): WorkflowInstance | null {
  return store().workflows.get(key(organizationId, id)) ?? null;
}

export function listWorkflows(organizationId: string): WorkflowInstance[] {
  return [...store().workflows.values()].filter(
    (w) => w.organizationId === organizationId
  );
}

export function upsertReminder(r: Reminder): Reminder {
  store().reminders.set(key(r.organizationId, r.id), r);
  return r;
}

export function listReminders(organizationId: string): Reminder[] {
  return [...store().reminders.values()].filter(
    (r) => r.organizationId === organizationId
  );
}
