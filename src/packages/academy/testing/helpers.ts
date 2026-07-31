import { resetCommunicationEngineForTests } from "@/jag/communications";
import { resetDecisionEngineForTests } from "@/jag/decisions";
import { resetDocumentEngineForTests } from "@/jag/documents";
import { resetPackageEngineForTests } from "@/jag/packages";
import { resetProcessEngineForTests } from "@/jag/processes";
import { resetJagPackageHostForTests } from "@/jag/runtime/package-host";
import { bindAcademyPackageHost } from "@/packages/academy/host";
import { resetAcademyLocalizationForTests } from "@/packages/academy/registration/localization/register";
import { resetAcademyTerminologyForTests } from "@/packages/academy/registration/terminology/register";
import { resetAcademySisForTests } from "@/packages/academy/sis";
import { resetAcademySchedulingForTests } from "@/packages/academy/scheduling";

/** Reset Package Runtime + peer engines + re-bind Academy host for isolated tests. */
export function resetAcademyPackageRuntimeForTests(): void {
  resetPackageEngineForTests();
  resetProcessEngineForTests();
  resetDocumentEngineForTests();
  resetCommunicationEngineForTests();
  resetDecisionEngineForTests();
  resetJagPackageHostForTests();
  resetAcademyTerminologyForTests();
  resetAcademyLocalizationForTests();
  resetAcademySisForTests();
  resetAcademySchedulingForTests();
  bindAcademyPackageHost();
}
