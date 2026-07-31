export {
  appOk,
  appFail,
  fromDomain,
  type ApplicationIssue,
  type ApplicationResult,
} from "@/applications/academyos/application/shared/result";
export {
  type ApplicationContext,
  hasPermission,
  requirePermission,
} from "@/applications/academyos/application/shared/context";
export {
  requireTrimmed,
  requirePositiveNumber,
  collectIssues,
} from "@/applications/academyos/application/shared/validation";
