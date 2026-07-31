export {
  ensureAcademyOSBooted,
  getAcademyOSStartup,
  getAcademyOSHealth,
  getAcademyOSContainer,
  bindAcademyOSStarter,
  recordAcademyOSStartup,
  resetAcademyOSBootForTests,
} from "@/applications/academyos/runtime/boot";

export {
  getAcademyOSDiagnosticsSnapshot,
  type AcademyOSDiagnosticsSnapshot,
} from "@/applications/academyos/runtime/diagnostics";
