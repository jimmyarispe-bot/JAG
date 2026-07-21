/** Standard action verbs and labels for The JAG interaction lifecycle. */

export type ActionVerb =
  | "save"
  | "create"
  | "delete"
  | "publish"
  | "approve"
  | "sync"
  | "import"
  | "export"
  | "send"
  | "hire"
  | "submit"
  | "generate"
  | "run"
  | "build"
  | "upload"
  | "open"
  | "retry"
  | "custom";

export type ActionStatus = "idle" | "loading" | "processing" | "success" | "error";

export type ActionLabelSet = {
  idle: string;
  loading: string;
  processing: string;
  success: string;
  error: string;
};

const VERB_LABELS: Record<Exclude<ActionVerb, "custom">, ActionLabelSet> = {
  save: {
    idle: "Save",
    loading: "Saving…",
    processing: "Processing…",
    success: "✓ Saved",
    error: "Unable to save",
  },
  create: {
    idle: "Create",
    loading: "Creating…",
    processing: "Processing…",
    success: "✓ Created",
    error: "Unable to create",
  },
  delete: {
    idle: "Delete",
    loading: "Deleting…",
    processing: "Processing…",
    success: "✓ Deleted",
    error: "Unable to delete",
  },
  publish: {
    idle: "Publish",
    loading: "Publishing…",
    processing: "Processing…",
    success: "✓ Published",
    error: "Unable to publish",
  },
  approve: {
    idle: "Approve",
    loading: "Approving…",
    processing: "Processing…",
    success: "✓ Approved",
    error: "Unable to approve",
  },
  sync: {
    idle: "Sync",
    loading: "Syncing…",
    processing: "Processing…",
    success: "✓ Synced",
    error: "Unable to sync",
  },
  import: {
    idle: "Import",
    loading: "Importing…",
    processing: "Processing…",
    success: "✓ Imported",
    error: "Unable to import",
  },
  export: {
    idle: "Export",
    loading: "Preparing export…",
    processing: "Downloading…",
    success: "✓ Exported",
    error: "Unable to export",
  },
  send: {
    idle: "Send",
    loading: "Sending…",
    processing: "Processing…",
    success: "✓ Sent",
    error: "Unable to send",
  },
  hire: {
    idle: "Hire Employee",
    loading: "Hiring…",
    processing: "Processing…",
    success: "✓ Hired",
    error: "Unable to hire",
  },
  submit: {
    idle: "Submit",
    loading: "Submitting…",
    processing: "Processing…",
    success: "✓ Submitted",
    error: "Unable to submit",
  },
  generate: {
    idle: "Generate",
    loading: "Generating…",
    processing: "Processing…",
    success: "✓ Generated",
    error: "Unable to generate",
  },
  run: {
    idle: "Run",
    loading: "Running…",
    processing: "Processing…",
    success: "✓ Complete",
    error: "Unable to run",
  },
  build: {
    idle: "Build",
    loading: "Building…",
    processing: "Processing…",
    success: "✓ Built",
    error: "Unable to build",
  },
  upload: {
    idle: "Upload",
    loading: "Uploading…",
    processing: "Processing…",
    success: "✓ Uploaded",
    error: "Unable to upload",
  },
  open: {
    idle: "Open",
    loading: "Opening…",
    processing: "Navigating…",
    success: "✓ Open",
    error: "Unable to open",
  },
  retry: {
    idle: "Retry",
    loading: "Retrying…",
    processing: "Processing…",
    success: "✓ Done",
    error: "Unable to retry",
  },
};

export function resolveActionLabels(
  verb: ActionVerb = "save",
  overrides?: Partial<ActionLabelSet> & { idle?: string }
): ActionLabelSet {
  const base =
    verb === "custom"
      ? {
          idle: overrides?.idle ?? "Save",
          loading: "Working…",
          processing: "Processing…",
          success: "✓ Done",
          error: "Unable to complete",
        }
      : VERB_LABELS[verb];

  return {
    idle: overrides?.idle ?? base.idle,
    loading: overrides?.loading ?? base.loading,
    processing: overrides?.processing ?? base.processing,
    success: overrides?.success ?? base.success,
    error: overrides?.error ?? base.error,
  };
}

/** UX-004 — success flash 500–1000ms before returning to idle. */
export const DEFAULT_SUCCESS_DURATION_MS = 800;
/** UX-004 — operations beyond 2s escalate to processing + global progress. */
export const DEFAULT_PROCESSING_THRESHOLD_MS = 2000;
/** Immediate feedback target (spinner may show from first paint of loading). */
export const IMMEDIATE_FEEDBACK_MS = 100;
export const DEFAULT_ERROR_HINT = "Please try again.";
