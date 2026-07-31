/**
 * Google Workspace metadata fetch — demo fixtures + live stubs.
 * Never downloads or parses document/message bodies.
 */

import type {
  GwsSyncBundle,
  GwsTokenBundle,
} from "@/lib/connectors/google-workspace/types";

export function createDemoGoogleWorkspaceSyncBundle(): GwsSyncBundle {
  const now = new Date().toISOString();
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  return {
    drive: [
      {
        id: "drive-pdf-1",
        name: "Board Packet FY2026.pdf",
        mimeType: "application/pdf",
        kind: "pdf",
        modifiedTime: now,
        parents: ["folder-board"],
        webViewLink: "https://drive.google.com/file/d/drive-pdf-1",
      },
      {
        id: "drive-docx-1",
        name: "Staff Handbook.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        kind: "docx",
        modifiedTime: now,
        parents: ["folder-hr"],
      },
      {
        id: "drive-sheet-1",
        name: "Enrollment Tracker",
        mimeType: "application/vnd.google-apps.spreadsheet",
        kind: "sheet",
        modifiedTime: now,
        parents: ["folder-ops"],
      },
      {
        id: "drive-slides-1",
        name: "All Hands Deck",
        mimeType: "application/vnd.google-apps.presentation",
        kind: "slides",
        modifiedTime: now,
        parents: ["folder-ops"],
      },
      {
        id: "folder-board",
        name: "Board",
        mimeType: "application/vnd.google-apps.folder",
        kind: "folder",
        modifiedTime: now,
        parents: [],
      },
    ],
    calendars: [
      {
        id: "cal-primary",
        summary: "Primary",
        primary: true,
      },
      {
        id: "cal-leadership",
        summary: "Leadership",
      },
    ],
    events: [
      {
        id: "evt-1",
        calendarId: "cal-primary",
        summary: "Weekly Leadership Sync",
        start: soon,
        end: new Date(Date.parse(soon) + 60 * 60 * 1000).toISOString(),
        status: "confirmed",
      },
      {
        id: "evt-2",
        calendarId: "cal-leadership",
        summary: "Board Prep",
        start: soon,
        end: new Date(Date.parse(soon) + 90 * 60 * 1000).toISOString(),
        status: "confirmed",
      },
    ],
    messages: [
      {
        id: "msg-1",
        from: "principal@demo.academy",
        to: "founder@demo.academy",
        subject: "Enrollment update",
        timestamp: now,
        labels: ["INBOX", "IMPORTANT"],
      },
      {
        id: "msg-2",
        from: "finance@demo.academy",
        to: "founder@demo.academy",
        subject: "Q4 close checklist",
        timestamp: now,
        labels: ["INBOX"],
      },
    ],
    contacts: [
      {
        id: "contact-1",
        displayName: "Alex Rivera",
        email: "alex.rivera@example.com",
        organization: "Family Rivera",
      },
      {
        id: "contact-2",
        displayName: "Jordan Lee",
        email: "jordan.lee@example.com",
        organization: null,
      },
    ],
  };
}

export async function fetchGoogleWorkspaceMetadata(input: {
  tokens: GwsTokenBundle;
  fetchImpl?: typeof fetch;
  forceLive?: boolean;
}): Promise<{ ok: true; bundle: GwsSyncBundle } | { ok: false; error: string }> {
  if (input.tokens.demo && !input.forceLive) {
    return { ok: true, bundle: createDemoGoogleWorkspaceSyncBundle() };
  }

  // Live metadata fetch is reserved for production credentials.
  // This sprint validates the framework path via demo fixtures.
  void input.fetchImpl;
  return {
    ok: false,
    error:
      "Live Google Workspace metadata fetch is not enabled in this environment. Use demo connect or provide a demo token bundle.",
  };
}
