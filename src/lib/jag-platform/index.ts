export {
  JAG_PLATFORM_ROLES,
  ACADEMYOS_PRODUCT_ROLES,
  isJagPlatformRole,
  isAcademyOsProductRole,
  platformRolesOverlapAcademyOs,
  type JagPlatformRole,
  type AcademyOsProductRole,
} from "@/lib/jag-platform/roles";

export {
  JAG_PLATFORM_SESSION_COOKIE,
  JAG_PLATFORM_SESSION_COOKIE_LEGACY,
  encodeJagPlatformSession,
  decodeJagPlatformSession,
  jagPlatformSessionCookieOptions,
  hasJagPlatformSessionCookie,
  clearJagPlatformSessionCookies,
  type JagPlatformSession,
} from "@/lib/jag-platform/session";

export {
  JAG_PLATFORM_DEMO_ACCOUNTS,
  authenticateJagPlatform,
  tryAuthenticateJagPlatformDemo,
  isJagPlatformDemoAuthEnabled,
  GENERIC_JAG_AUTH_FAILURE,
  JAG_PLATFORM_LOGIN_PATH,
  JAG_PLATFORM_FORGOT_PASSWORD_PATH,
  JAG_PLATFORM_RESET_PASSWORD_PATH,
  JAG_PLATFORM_HOME_PATH,
  ACADEMYOS_LAUNCH_PATH,
  type JagPlatformCredentials,
  type JagPlatformAuthResult,
} from "@/lib/jag-platform/auth";

export {
  authenticateJagPlatformLogin,
  completeJagAuthorization,
  JAG_SESSION_ESTABLISH_PATH,
} from "@/lib/jag-platform/login";

export {
  JAG_PLATFORM_NAV,
  ACADEMYOS_NAV_FORBIDDEN_LABELS,
  jagNavContainsAcademyOsItems,
  listJagPlatformNavForSession,
  type JagPlatformNavItem,
} from "@/lib/jag-platform/navigation";

export {
  JAG_PLATFORM_ORGANIZATIONS,
  getAcademyWayOrganization,
  type JagInstalledProduct,
  type JagOrganizationCard,
} from "@/lib/jag-platform/organizations";

export {
  JAG_PLATFORM_HEALTH,
  getPlatformHealthSnapshot,
  type JagPlatformHealth,
  type PlatformHealthSnapshot,
  type PlatformModuleHealth,
} from "@/lib/jag-platform/health";

export {
  JAG_PLATFORM_VERSION,
  formatPlatformVersionBanner,
  type JagPlatformVersionInfo,
} from "@/lib/jag-platform/versioning";

export {
  canViewPlatformHealth,
  PLATFORM_HEALTH_ROLES,
} from "@/lib/jag-platform/admin-access";

export {
  createJagPlatformError,
  JagErrors,
  toPublicErrorBody,
  type JagPlatformError,
  type JagRetryRecommendation,
} from "@/lib/jag-platform/errors";

export {
  jagLog,
  jagLogger,
  listRecentJagPlatformLogs,
  resetJagPlatformLogsForTests,
  type JagLogEntry,
  type JagLogLevel,
} from "@/lib/jag-platform/logging";

export {
  emitJagPlatformEvent,
  listJagPlatformEvents,
  resetJagPlatformEventsForTests,
  eventThroughputLastHour,
  type JagPlatformEvent,
  type JagEventSourceModule,
} from "@/lib/jag-platform/events";

export {
  jsonOk,
  jsonError,
  requireJagApiSession,
  requireJagApiAdmin,
  requireOrganizationId,
  parsePagination,
  paginateItems,
  type PaginationInput,
  type Paginated,
} from "@/lib/jag-platform/api";

export {
  JAG_PERFORMANCE_FINDINGS,
  type PerformanceFinding,
} from "@/lib/jag-platform/performance";
