/**
 * ApplicationModel — canonical declarative description of an application package.
 * No executable industry logic — data only.
 */

import type { CommunicationModelBundle } from "@/jag/modeling/communication-model";
import type { DecisionModel } from "@/jag/modeling/decision-model";
import type { DocumentModelBundle } from "@/jag/modeling/document-model";
import type { EntityModel } from "@/jag/modeling/entity-model";
import type { FormModel } from "@/jag/modeling/form-model";
import type { NavigationModel } from "@/jag/modeling/navigation-model";
import type { PermissionModel } from "@/jag/modeling/permission-model";
import type { ProcessModel } from "@/jag/modeling/process-model";
import type { ReportModel } from "@/jag/modeling/report-model";

export type ApplicationModelMetadata = {
  readonly id: string;
  readonly applicationId: string;
  readonly displayName: string;
  readonly description?: string;
  readonly version: string;
  readonly publisher?: string;
  readonly tags?: readonly string[];
};

export type TerminologyModel = {
  readonly id: string;
  readonly label: string;
  readonly terms: Readonly<Record<string, string>>;
};

export type LocalizationModel = {
  readonly id: string;
  readonly locale: string;
  readonly label: string;
  readonly messages: Readonly<Record<string, string>>;
};

export type WorkflowModel = {
  readonly id: string;
  readonly [key: string]: unknown;
};

export type IntegrationModel = {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly config?: Readonly<Record<string, unknown>>;
};

export type ConfigurationModel = {
  readonly keys: Readonly<Record<string, unknown>>;
};

/**
 * Canonical application description compiled by the Modeling Engine.
 */
export type ApplicationModel = {
  readonly metadata: ApplicationModelMetadata;
  readonly entities?: readonly EntityModel[];
  readonly processes?: readonly ProcessModel[];
  readonly decisions?: readonly DecisionModel[];
  readonly forms?: readonly FormModel[];
  readonly documents?: DocumentModelBundle;
  readonly communications?: CommunicationModelBundle;
  readonly permissions?: readonly PermissionModel[];
  readonly reports?: readonly ReportModel[];
  readonly navigation?: readonly NavigationModel[];
  readonly workflows?: readonly WorkflowModel[];
  readonly terminology?: readonly TerminologyModel[];
  readonly localization?: readonly LocalizationModel[];
  readonly integrations?: readonly IntegrationModel[];
  readonly configuration?: ConfigurationModel;
};
