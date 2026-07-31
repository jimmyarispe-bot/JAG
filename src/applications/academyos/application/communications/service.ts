import type {
  AnnouncementDto,
  CreateMessageCommand,
  MessageDto,
  PublishAnnouncementCommand,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import { CommunicationsDomainService } from "@/applications/academyos/domain/communications/service";
import type { CommunicationsRepository } from "@/applications/academyos/domain/repositories";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";

export type CommunicationsApplicationServiceDeps = {
  communicationsRepo: CommunicationsRepository;
  entities?: typeof EntityPlatformAdapter;
};

export type CommunicationsApplicationService = {
  createMessage(
    ctx: ApplicationContext,
    command: CreateMessageCommand
  ): Promise<ApplicationResult<MessageDto>>;
  publishAnnouncement(
    ctx: ApplicationContext,
    command: PublishAnnouncementCommand
  ): Promise<ApplicationResult<AnnouncementDto>>;
};

export function createCommunicationsApplicationService(
  deps: CommunicationsApplicationServiceDeps
): CommunicationsApplicationService {
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async createMessage(ctx, command) {
      const gate = requirePermission(ctx, "academyos.communications.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = CommunicationsDomainService.createMessage(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.communicationsRepo.saveMessage(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "Message",
        displayName: saved.displayName,
        status: "draft",
        organizationId: ctx.organizationId,
        metadata: { channel: saved.channel },
      });

      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        body: saved.body ?? null,
        studentId: saved.studentId ?? null,
        familyId: saved.familyId ?? null,
        channel: saved.channel,
        status: saved.status,
      });
    },

    async publishAnnouncement(ctx, command) {
      const gate = requirePermission(ctx, "academyos.communications.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = CommunicationsDomainService.publishAnnouncement(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.communicationsRepo.saveAnnouncement(
        drafted.value
      );
      entities.mirror({
        id: saved.id,
        entityType: "Announcement",
        displayName: saved.displayName,
        status: "active",
        organizationId: ctx.organizationId,
        metadata: { audience: saved.audience },
      });

      return appOk({
        id: saved.id,
        displayName: saved.displayName,
        body: saved.body ?? null,
        schoolId: saved.schoolId ?? null,
        audience: saved.audience,
        status: saved.status,
        publishOn: saved.publishOn ?? null,
      });
    },
  };
}
