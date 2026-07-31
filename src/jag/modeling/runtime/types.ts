/**
 * Modeling runtime — compile ports and results.
 */

import type { PackageContributionKind } from "@/jag/packages";
import type { LocalizationModel, TerminologyModel, WorkflowModel } from "@/jag/modeling/application-model";
import type { PermissionModel } from "@/jag/modeling/permission-model";
import type { ReportModel } from "@/jag/modeling/report-model";

/**
 * Optional ports for contribution kinds without a dedicated JAG registry.
 * Hosts (packages) bind these — the compiler stays industry-agnostic.
 */
export type ApplicationModelCompilerPorts = {
  readonly registerPermissionPack?: (pack: PermissionModel) => void;
  readonly registerReport?: (report: ReportModel) => void;
  readonly registerTerminology?: (pack: TerminologyModel) => void;
  readonly registerLocalization?: (pack: LocalizationModel) => void;
  readonly registerWorkflow?: (workflow: WorkflowModel) => void;
};

export type CompiledContributionSnapshot = {
  readonly kind: PackageContributionKind;
  readonly ids: readonly string[];
};

export type ApplicationModelCompileResult = {
  readonly ok: boolean;
  readonly applicationId: string;
  readonly packageId: string;
  readonly version: string;
  readonly contributions: readonly CompiledContributionSnapshot[];
  readonly counts: {
    readonly entities: number;
    readonly forms: number;
    readonly workflows: number;
    readonly processes: number;
    readonly decisions: number;
    readonly documents: number;
    readonly communications: number;
    readonly permissions: number;
    readonly reports: number;
    readonly navigation: number;
    readonly terminology: number;
    readonly localization: number;
  };
  readonly error?: { readonly code: string; readonly message: string };
};
