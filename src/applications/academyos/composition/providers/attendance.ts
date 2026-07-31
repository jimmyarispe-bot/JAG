import { createAttendanceApplicationService } from "@/applications/academyos/application/attendance/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
} from "@/applications/academyos/composition/types";

export function registerAttendanceProvider(input: {
  repositories: AcademyRepositories;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createAttendanceApplicationService({
    attendanceRepo: input.repositories.attendance,
    entities: input.platformAdapters.entity,
  });
}
