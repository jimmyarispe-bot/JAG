/**
 * Version lifecycle helpers for Interest Forms (one draft, immutable published).
 */

import {
  hashInterestFormDefinition,
  validateInterestFormDefinition,
} from "@/lib/admissions/interest-form/definition";
import type { InterestFormDefinition } from "@/lib/admissions/interest-form/types";

export type InterestFormVersionRecord = {
  id: string;
  formId: string;
  organizationId: string;
  versionNumber: number;
  lifecycle: "draft" | "published" | "archived";
  definition: InterestFormDefinition;
  contentHash: string;
};

export type InterestFormHeader = {
  id: string;
  organizationId: string;
  title: string;
  draftVersionId: string | null;
  publishedVersionId: string | null;
};

/**
 * Create form header + published v1 (Phase 1 seed path).
 */
export function createPublishedInterestForm(input: {
  organizationId: string;
  title?: string;
  definition: InterestFormDefinition;
  formId?: string;
  versionId?: string;
}): {
  form: InterestFormHeader;
  version: InterestFormVersionRecord;
} {
  const errors = validateInterestFormDefinition(input.definition);
  if (errors.length) {
    throw new Error(`Invalid interest form definition: ${errors.join("; ")}`);
  }

  const formId = input.formId ?? crypto.randomUUID();
  const versionId = input.versionId ?? crypto.randomUUID();
  const contentHash = hashInterestFormDefinition(input.definition);

  return {
    form: {
      id: formId,
      organizationId: input.organizationId,
      title: input.title ?? input.definition.title ?? "Express Interest",
      draftVersionId: null,
      publishedVersionId: versionId,
    },
    version: {
      id: versionId,
      formId,
      organizationId: input.organizationId,
      versionNumber: 1,
      lifecycle: "published",
      definition: input.definition,
      contentHash,
    },
  };
}

/**
 * published vN → draft vN+1 (single working draft).
 */
export function openDraftFromPublished(input: {
  form: InterestFormHeader;
  published: InterestFormVersionRecord;
  draftVersionId?: string;
  nextDefinition?: InterestFormDefinition;
}): {
  form: InterestFormHeader;
  draft: InterestFormVersionRecord;
} {
  if (input.published.lifecycle !== "published") {
    throw new Error("Can only draft from a published version");
  }
  if (input.form.draftVersionId) {
    throw new Error("A working draft already exists");
  }

  const definition = input.nextDefinition ?? input.published.definition;
  const errors = validateInterestFormDefinition(definition);
  if (errors.length) {
    throw new Error(`Invalid interest form definition: ${errors.join("; ")}`);
  }

  const draftId = input.draftVersionId ?? crypto.randomUUID();
  const draft: InterestFormVersionRecord = {
    id: draftId,
    formId: input.form.id,
    organizationId: input.form.organizationId,
    versionNumber: input.published.versionNumber + 1,
    lifecycle: "draft",
    definition,
    contentHash: hashInterestFormDefinition(definition),
  };

  return {
    form: { ...input.form, draftVersionId: draftId },
    draft,
  };
}

/**
 * Publish working draft: archive previous published, set draft → published.
 */
export function publishWorkingDraft(input: {
  form: InterestFormHeader;
  draft: InterestFormVersionRecord;
  previousPublished: InterestFormVersionRecord | null;
}): {
  form: InterestFormHeader;
  published: InterestFormVersionRecord;
  archived: InterestFormVersionRecord | null;
} {
  if (input.draft.lifecycle !== "draft") {
    throw new Error("Only draft versions can be published");
  }
  if (input.form.draftVersionId !== input.draft.id) {
    throw new Error("Draft is not the form working draft");
  }

  const archived =
    input.previousPublished == null
      ? null
      : ({ ...input.previousPublished, lifecycle: "archived" as const });

  const published: InterestFormVersionRecord = {
    ...input.draft,
    lifecycle: "published",
    contentHash: hashInterestFormDefinition(input.draft.definition),
  };

  return {
    form: {
      ...input.form,
      draftVersionId: null,
      publishedVersionId: published.id,
    },
    published,
    archived,
  };
}

/**
 * Reject mutating a published version's definition (application-level guard).
 */
export function assertPublishedVersionImmutable(
  version: InterestFormVersionRecord,
  nextDefinition: InterestFormDefinition
): void {
  if (version.lifecycle !== "published") return;
  const nextHash = hashInterestFormDefinition(nextDefinition);
  if (nextHash !== version.contentHash) {
    throw new Error("Published interest form versions are immutable");
  }
}
