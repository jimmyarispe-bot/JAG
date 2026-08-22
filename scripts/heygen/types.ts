/**
 * Local HeyGen video-generation types (developer tooling only).
 */

export type JagVideoManifestEntry = {
  readonly id: string;
  readonly title: string;
  /** Spoken script for HeyGen. Use "Mr. Jag" for spoken self-reference (not "Mr. J-A-G"). */
  readonly script: string;
  readonly enabled: boolean;
};

export type JagVideoManifest = {
  readonly version: 1;
  readonly brand: {
    readonly writtenInstructor: "Mr. Jag";
    readonly writtenProduct: "The Jag";
  };
  readonly videos: readonly JagVideoManifestEntry[];
};

export type HeyGenVideoStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "unknown";

export type GenerationRecord = {
  readonly manifestId: string;
  readonly title: string;
  readonly heygenVideoId: string | null;
  readonly status: HeyGenVideoStatus | "skipped" | "dry_run" | "error";
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly videoUrl: string | null;
  readonly failureReason: string | null;
  readonly dryRun: boolean;
};

export type GenerationStateFile = {
  readonly version: 1;
  readonly updatedAt: string;
  readonly records: Record<string, GenerationRecord>;
};

export type HeyGenCreateVideoRequest = {
  readonly type: "avatar";
  readonly avatar_id: string;
  readonly script: string;
  readonly voice_id: string;
  readonly title: string;
  readonly resolution: "1080p";
  readonly engine: { readonly type: "avatar_iv" };
  readonly voice_settings: { readonly speed: number };
};

export type HeyGenCreateVideoResponse = {
  readonly data?: {
    readonly video_id?: string;
  };
  readonly error?: unknown;
  readonly message?: string;
};

export type HeyGenVideoStatusResponse = {
  readonly data?: {
    readonly status?: string;
    readonly video_url?: string | null;
    readonly failure_message?: string | null;
    readonly failure_code?: string | null;
  };
  readonly error?: unknown;
  readonly message?: string;
};

export type HeyGenClientOptions = {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
};

export type GenerateOptions = {
  readonly manifestPath: string;
  readonly statePath: string;
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly id?: string;
  readonly poll: boolean;
  readonly pollIntervalMs: number;
  readonly pollTimeoutMs: number;
};
