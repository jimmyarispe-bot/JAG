import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { CommunicationType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface TimelineCommunicationItem {
  id: string;
  auditId: string;
  type: CommunicationType;
  direction: string;
  status: string;
  subject: string | null;
  bodyPreview: string | null;
  senderDisplayName: string | null;
  createdAt: string;
  sentAt: string | null;
  studentId: string | null;
  familyId: string | null;
  source: "platform_communications";
}

export async function getFamilyCommunicationTimeline(
  supabase: AuthClient,
  familyId: string,
  limit = 50
): Promise<TimelineCommunicationItem[]> {
  const { data } = await supabase
    .from("platform_communications")
    .select(
      "id, audit_id, type, direction, status, subject, body_text, sender_display_name, created_at, sent_at, student_id, family_id"
    )
    .eq("family_id", familyId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapRow);
}

export async function getStudentCommunicationTimeline(
  supabase: AuthClient,
  studentId: string,
  limit = 50
): Promise<TimelineCommunicationItem[]> {
  const { data: student } = await supabase
    .from("students")
    .select("family_id")
    .eq("id", studentId)
    .maybeSingle();

  let q = supabase
    .from("platform_communications")
    .select(
      "id, audit_id, type, direction, status, subject, body_text, sender_display_name, created_at, sent_at, student_id, family_id"
    )
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (student?.family_id) {
    q = q.or(`student_id.eq.${studentId},family_id.eq.${student.family_id}`);
  } else {
    q = q.eq("student_id", studentId);
  }

  const { data } = await q;
  return (data ?? []).map(mapRow);
}

function mapRow(row: {
  id: string;
  audit_id: string;
  type: string;
  direction: string;
  status: string;
  subject: string | null;
  body_text: string | null;
  sender_display_name: string | null;
  created_at: string;
  sent_at: string | null;
  student_id: string | null;
  family_id: string | null;
}): TimelineCommunicationItem {
  return {
    id: row.id,
    auditId: row.audit_id,
    type: row.type as CommunicationType,
    direction: row.direction,
    status: row.status,
    subject: row.subject,
    bodyPreview: row.body_text ? row.body_text.slice(0, 180) : null,
    senderDisplayName: row.sender_display_name,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    studentId: row.student_id,
    familyId: row.family_id,
    source: "platform_communications",
  };
}
