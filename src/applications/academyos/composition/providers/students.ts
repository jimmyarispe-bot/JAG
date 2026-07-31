import { createStudentApplicationService } from "@/applications/academyos/application/students/service";
import type {
  AcademyPlatformAdapters,
  AcademyRepositories,
  AcademyWorkflowAdapters,
} from "@/applications/academyos/composition/types";

export function registerStudentProvider(input: {
  repositories: AcademyRepositories;
  workflowAdapters: AcademyWorkflowAdapters;
  platformAdapters: AcademyPlatformAdapters;
}) {
  return createStudentApplicationService({
    studentRepo: input.repositories.student,
    enrollmentRepo: input.repositories.enrollment,
    workflows: input.workflowAdapters.students,
    entities: input.platformAdapters.entity,
  });
}
