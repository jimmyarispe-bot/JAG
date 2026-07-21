import type { MeetingMemory, MemoryScope } from "@/lib/platform/intelligence/executive-memory/types";

export function createMeetingMemory(
  input: {
    title: string;
    summary?: string;
    attendees?: string[];
    topics?: string[];
    heldAt?: string;
    domains?: string[];
  },
  scope: MemoryScope,
  nowIso: string,
  createId: (prefix: string) => string
): MeetingMemory {
  return {
    id: createId("meeting"),
    kind: "meeting",
    title: input.title,
    summary: input.summary ?? input.title,
    createdAt: nowIso,
    updatedAt: nowIso,
    scope,
    domains: input.domains ?? [],
    tags: ["meeting"],
    confidence: 0.8,
    evidence: [],
    retention: "archive",
    sourceIds: [],
    metadata: {},
    attendees: input.attendees ?? [],
    topics: input.topics ?? [],
    heldAt: input.heldAt ?? nowIso,
  };
}
