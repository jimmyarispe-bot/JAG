import type {
  AttendanceDto,
  AttendanceSummaryDto,
  RecordAttendanceCommand,
} from "@/applications/academyos/application/dto";
import {
  appFail,
  appOk,
  fromDomain,
  requirePermission,
  type ApplicationContext,
  type ApplicationResult,
} from "@/applications/academyos/application/shared";
import { AttendanceDomainService } from "@/applications/academyos/domain/attendance/service";
import type { AttendanceRepository } from "@/applications/academyos/domain/repositories";
import { EntityPlatformAdapter } from "@/applications/academyos/platform-adapters";

export type AttendanceApplicationServiceDeps = {
  attendanceRepo: AttendanceRepository;
  entities?: typeof EntityPlatformAdapter;
};

export type AttendanceApplicationService = {
  recordAttendance(
    ctx: ApplicationContext,
    command: RecordAttendanceCommand
  ): Promise<ApplicationResult<AttendanceDto>>;
  summarizeStudent(
    ctx: ApplicationContext,
    studentId: string
  ): Promise<ApplicationResult<AttendanceSummaryDto>>;
};

export function createAttendanceApplicationService(
  deps: AttendanceApplicationServiceDeps
): AttendanceApplicationService {
  const entities = deps.entities ?? EntityPlatformAdapter;

  return {
    async recordAttendance(ctx, command) {
      const gate = requirePermission(ctx, "academyos.attendance.create");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const drafted = AttendanceDomainService.recordAttendance(command);
      if (!drafted.ok) return fromDomain(drafted);

      const saved = await deps.attendanceRepo.save(drafted.value);
      entities.mirror({
        id: saved.id,
        entityType: "AttendanceRecord",
        displayName: `${saved.studentId} @ ${saved.attendanceDate}`,
        status: "active",
        organizationId: ctx.organizationId,
        metadata: { status: saved.status, studentId: saved.studentId },
      });

      return appOk({
        id: saved.id,
        studentId: saved.studentId,
        sectionId: saved.sectionId ?? null,
        classId: saved.classId ?? null,
        attendanceDate: saved.attendanceDate,
        attendanceCodeId: saved.attendanceCodeId ?? null,
        status: saved.status,
        notes: saved.notes ?? null,
      });
    },

    async summarizeStudent(ctx, studentId) {
      const gate = requirePermission(ctx, "academyos.attendance.read");
      if (!gate.ok) return appFail({ code: gate.code, message: gate.message });

      const rows = await deps.attendanceRepo.listByStudent(studentId);
      return appOk({
        studentId,
        rate: AttendanceDomainService.attendanceRate(rows),
        chronicallyAbsent: AttendanceDomainService.isChronicallyAbsent(rows),
        recordCount: rows.length,
      });
    },
  };
}
