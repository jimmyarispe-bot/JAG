import {
  resetAcademySisPermissionPackForTests,
  resetAcademySisReportsForTests,
} from "@/packages/academy/sis/reports";

export function resetAcademySisForTests(): void {
  resetAcademySisReportsForTests();
  resetAcademySisPermissionPackForTests();
}
