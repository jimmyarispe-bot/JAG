/** Evidence SDK — provider / processor / validator / mapper contracts. */

export type EvidenceDocumentDescriptor = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly domain: string;
  readonly source: string;
  readonly status: string;
  readonly createdAt: string;
};

export type EvidenceValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly error: string;
      readonly fieldErrors?: Readonly<Record<string, string>>;
    };

export interface EvidenceProvider {
  readonly id: string;
  readonly version: string;
  list(organizationId: string): Promise<readonly EvidenceDocumentDescriptor[]>;
  get(
    organizationId: string,
    evidenceId: string
  ): Promise<EvidenceDocumentDescriptor | null>;
}

export interface EvidenceProcessor {
  readonly id: string;
  readonly version: string;
  process(
    organizationId: string,
    evidenceId: string
  ): Promise<EvidenceValidationResult>;
}

export interface EvidenceValidator {
  readonly id: string;
  validate(document: EvidenceDocumentDescriptor): EvidenceValidationResult;
}

export interface EvidenceMapper {
  readonly id: string;
  readonly sourceType: string;
  readonly targetDomain: string;
  map(input: Readonly<Record<string, unknown>>): EvidenceDocumentDescriptor;
}

export type EvidenceProviderRegistration = {
  readonly provider: EvidenceProvider;
  readonly registeredAt: string;
};
