import type {
  AnnouncementRecord,
  CommunicationsRepository,
  MessageRecord,
} from "@/applications/academyos/domain/repositories";
import {
  ACADEMYOS_TABLES,
  type DatabaseProvider,
} from "@/applications/academyos/infrastructure/database";
import {
  AnnouncementMapper,
  MessageMapper,
} from "@/applications/academyos/infrastructure/persistence/mapping";

export class SupabaseCommunicationsRepository
  implements CommunicationsRepository
{
  constructor(private readonly db: DatabaseProvider) {}

  async saveMessage(record: MessageRecord) {
    return MessageMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.messages)
        .upsert(MessageMapper.domainToRow(record))
    );
  }

  async getMessage(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.messages).findById(id);
    return row ? MessageMapper.rowToDomain(row) : null;
  }

  async saveAnnouncement(record: AnnouncementRecord) {
    return AnnouncementMapper.rowToDomain(
      await this.db
        .from(ACADEMYOS_TABLES.announcements)
        .upsert(AnnouncementMapper.domainToRow(record))
    );
  }

  async getAnnouncement(id: string) {
    const row = await this.db.from(ACADEMYOS_TABLES.announcements).findById(id);
    return row ? AnnouncementMapper.rowToDomain(row) : null;
  }
}
