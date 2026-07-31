import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  pickNullableString,
  pickString,
} from "@/applications/academyos/infrastructure/database/mappers";
import type {
  AnnouncementRecord,
  CommunicationsRepository,
  MessageRecord,
} from "@/applications/academyos/domain/repositories";

export function createSupabaseCommunicationsRepository(
  db: DatabaseProvider
): CommunicationsRepository {
  const messages = db.from(ACADEMYOS_TABLES.messages);
  const announcements = db.from(ACADEMYOS_TABLES.announcements);

  return {
    async saveMessage(record: MessageRecord) {
      const saved = await messages.upsert({
        id: record.id,
        display_name: record.displayName,
        body: record.body ?? null,
        student_id: record.studentId ?? null,
        family_id: record.familyId ?? null,
        channel: record.channel,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        body: pickNullableString(saved, "body"),
        studentId: pickNullableString(saved, "student_id"),
        familyId: pickNullableString(saved, "family_id"),
        channel: pickString(saved, "channel"),
        status: pickString(saved, "status"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
    async getMessage(id) {
      const row = await messages.findById(id);
      if (!row) return null;
      return {
        id: pickString(row, "id"),
        displayName: pickString(row, "display_name"),
        body: pickNullableString(row, "body"),
        studentId: pickNullableString(row, "student_id"),
        familyId: pickNullableString(row, "family_id"),
        channel: pickString(row, "channel"),
        status: pickString(row, "status"),
        createdAt: pickString(row, "created_at"),
        updatedAt: pickString(row, "updated_at"),
      };
    },
    async saveAnnouncement(record: AnnouncementRecord) {
      const saved = await announcements.upsert({
        id: record.id,
        display_name: record.displayName,
        body: record.body ?? null,
        school_id: record.schoolId ?? null,
        audience: record.audience,
        status: record.status,
        publish_on: record.publishOn ?? null,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      return {
        id: pickString(saved, "id"),
        displayName: pickString(saved, "display_name"),
        body: pickNullableString(saved, "body"),
        schoolId: pickNullableString(saved, "school_id"),
        audience: pickString(saved, "audience"),
        status: pickString(saved, "status"),
        publishOn: pickNullableString(saved, "publish_on"),
        createdAt: pickString(saved, "created_at"),
        updatedAt: pickString(saved, "updated_at"),
      };
    },
    async getAnnouncement(id) {
      const row = await announcements.findById(id);
      if (!row) return null;
      return {
        id: pickString(row, "id"),
        displayName: pickString(row, "display_name"),
        body: pickNullableString(row, "body"),
        schoolId: pickNullableString(row, "school_id"),
        audience: pickString(row, "audience"),
        status: pickString(row, "status"),
        publishOn: pickNullableString(row, "publish_on"),
        createdAt: pickString(row, "created_at"),
        updatedAt: pickString(row, "updated_at"),
      };
    },
  };
}
