/**
 * Read-only HeyGen asset discovery for existing Mr. Jag / Sawyer assets.
 * GET requests only — never creates videos or avatars.
 *
 * Mr. Jag is resolved via avatar GROUPS first, then looks scoped by group_id.
 * The global /v3/avatars/looks catalog is never scanned.
 */

import { APPROVED_HEYGEN_SETUP, HEYGEN_API_BASE_URL } from "./config";
import { HeyGenClient } from "./client";
import { safeLog } from "./redact";

export const TARGET_AVATAR_NAME = APPROVED_HEYGEN_SETUP.avatarDisplayName; // "Mr. Jag"
export const TARGET_VOICE_NAME = APPROVED_HEYGEN_SETUP.voiceDisplayName; // "Sawyer"

export class HeyGenDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeyGenDiscoveryError";
  }
}

export type DiscoveredAvatar = {
  readonly displayName: string;
  readonly avatarId: string;
  readonly type: string;
  readonly status: string | null;
  readonly groupId: string | null;
  readonly lookName: string;
};

export type DiscoveredVoice = {
  readonly displayName: string;
  readonly voiceId: string;
  readonly language: string | null;
  readonly gender: string | null;
  readonly type: string | null;
};

export type DiscoverAssetsResult = {
  readonly avatar: DiscoveredAvatar;
  readonly voice: DiscoveredVoice;
};

export function requireHeyGenApiKey(
  env: NodeJS.ProcessEnv = process.env
): { apiKey: string; baseUrl: string } {
  const apiKey = env.HEYGEN_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new HeyGenDiscoveryError(
      "Missing HEYGEN_API_KEY. Set it in .env.local (never commit the real key)."
    );
  }
  const baseUrl =
    env.HEYGEN_API_BASE_URL?.trim() || HEYGEN_API_BASE_URL;
  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, "") };
}

export function findExactNameMatches<T extends { name: string }>(
  items: readonly T[],
  exactName: string
): T[] {
  return items.filter((item) => item.name === exactName);
}

/** Exact group name to flag as an unverified candidate only — never auto-selected. */
export const UNVERIFIED_MR_JAG_CANDIDATE_GROUP_NAME = "Jared";

/** Safe diagnostic when exact Mr. Jag group is missing (no secrets / no auto-select). */
export function formatMissingMrJagGroupDiagnostic(
  groups: readonly {
    id: string;
    name: string;
    ownership?: string | null;
  }[]
): string {
  const lines = [
    `Could not find an exact HeyGen avatar group named '${TARGET_AVATAR_NAME}'. No unscoped looks scan will be performed.`,
    "",
    "No exact Mr. Jag group found. Available avatar groups:",
  ];
  if (groups.length === 0) {
    lines.push("(none)");
    return lines.join("\n");
  }
  for (const group of groups) {
    const ownership =
      group.ownership != null && String(group.ownership).trim() !== ""
        ? ` ownership=${group.ownership}`
        : "";
    let line = `- ${group.name} group_id=${group.id}${ownership}`;
    if (group.name === UNVERIFIED_MR_JAG_CANDIDATE_GROUP_NAME) {
      line += " — CANDIDATE ONLY — NOT VERIFIED AS MR. JAG";
    }
    lines.push(line);
  }
  return lines.join("\n");
}

/**
 * Resolve Mr. Jag from an exact avatar GROUP match plus that group's looks.
 * Looks must already be scoped to the group (fetched with group_id).
 */
export function resolveMrJagAvatar(input: {
  groups: readonly {
    id: string;
    name: string;
    status?: string | null;
  }[];
  looks: readonly {
    id: string;
    name: string;
    avatar_type: string;
    status?: string | null;
    group_id?: string | null;
  }[];
}): DiscoveredAvatar {
  const groupMatches = findExactNameMatches(input.groups, TARGET_AVATAR_NAME);

  if (groupMatches.length === 0) {
    throw new HeyGenDiscoveryError(
      formatMissingMrJagGroupDiagnostic(input.groups)
    );
  }

  if (groupMatches.length > 1) {
    const detail = groupMatches
      .map((g) => `- group_id=${g.id} status=${g.status ?? "n/a"}`)
      .join("\n");
    throw new HeyGenDiscoveryError(
      `Ambiguous avatar name "${TARGET_AVATAR_NAME}": multiple avatar groups matched.\n${detail}`
    );
  }

  const group = groupMatches[0]!;
  let groupLooks = input.looks.filter((l) => l.group_id === group.id);
  // When looks were fetched with ?group_id=, items may omit group_id.
  if (groupLooks.length === 0 && input.looks.length > 0) {
    groupLooks = [...input.looks];
  }

  if (groupLooks.length === 0) {
    throw new HeyGenDiscoveryError(
      `Avatar group "${TARGET_AVATAR_NAME}" (group_id=${group.id}) was found, but no looks were returned for that group.`
    );
  }

  if (groupLooks.length === 1) {
    const look = groupLooks[0]!;
    return {
      displayName: TARGET_AVATAR_NAME,
      avatarId: look.id,
      type: look.avatar_type,
      status: look.status ?? group.status ?? null,
      groupId: group.id,
      lookName: look.name,
    };
  }

  const named = findExactNameMatches(groupLooks, TARGET_AVATAR_NAME);
  if (named.length === 1) {
    const look = named[0]!;
    return {
      displayName: TARGET_AVATAR_NAME,
      avatarId: look.id,
      type: look.avatar_type,
      status: look.status ?? group.status ?? null,
      groupId: group.id,
      lookName: look.name,
    };
  }

  const detail = groupLooks
    .map(
      (l) =>
        `- look_id=${l.id} name=${l.name} type=${l.avatar_type} status=${l.status ?? "n/a"}`
    )
    .join("\n");
  throw new HeyGenDiscoveryError(
    `Avatar group "${TARGET_AVATAR_NAME}" has multiple looks; cannot choose uniquely.\n${detail}`
  );
}

export function resolveSawyerVoice(
  voices: readonly {
    voice_id: string;
    name: string;
    language?: string | null;
    gender?: string | null;
    type?: string | null;
  }[]
): DiscoveredVoice {
  const matches = findExactNameMatches(voices, TARGET_VOICE_NAME);
  if (matches.length === 0) {
    throw new HeyGenDiscoveryError(
      `Voice not found: exact display name "${TARGET_VOICE_NAME}" was not present in HeyGen voices.`
    );
  }
  if (matches.length > 1) {
    const detail = matches
      .map(
        (v) =>
          `- voice_id=${v.voice_id} language=${v.language ?? "n/a"} gender=${v.gender ?? "n/a"} type=${v.type ?? "n/a"}`
      )
      .join("\n");
    throw new HeyGenDiscoveryError(
      `Ambiguous voice name "${TARGET_VOICE_NAME}": multiple voices matched.\n${detail}`
    );
  }
  const voice = matches[0]!;
  return {
    displayName: TARGET_VOICE_NAME,
    voiceId: voice.voice_id,
    language: voice.language ?? null,
    gender: voice.gender ?? null,
    type: voice.type ?? null,
  };
}

export function formatDiscoverAssetsReport(
  result: DiscoverAssetsResult
): string {
  return [
    "HEYGEN ASSETS",
    "",
    result.avatar.displayName,
    `- avatar_id: ${result.avatar.avatarId}`,
    `- type: ${result.avatar.type}`,
    `- status: ${result.avatar.status ?? "n/a"}`,
    `- group_id: ${result.avatar.groupId ?? "n/a"}`,
    `- look_name: ${result.avatar.lookName}`,
    "",
    result.voice.displayName,
    `- voice_id: ${result.voice.voiceId}`,
    `- language: ${result.voice.language ?? "n/a"}`,
    `- gender: ${result.voice.gender ?? "n/a"}`,
    `- type: ${result.voice.type ?? "n/a"}`,
  ].join("\n");
}

export async function discoverHeyGenAssets(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
}): Promise<DiscoverAssetsResult> {
  const { apiKey, baseUrl } = requireHeyGenApiKey(deps?.env);
  const client =
    deps?.client ??
    new HeyGenClient({
      apiKey,
      baseUrl,
    });

  const apiKeyHint = deps?.env?.HEYGEN_API_KEY ?? apiKey;

  safeLog("Discovering private avatar groups...", apiKeyHint);
  let groups = await client.listAllAvatarGroups({ ownership: "private" });
  if (findExactNameMatches(groups, TARGET_AVATAR_NAME).length === 0) {
    safeLog("Discovering avatar groups (all ownership)...", apiKeyHint);
    groups = await client.listAllAvatarGroups({});
  }

  const groupMatches = findExactNameMatches(groups, TARGET_AVATAR_NAME);
  if (groupMatches.length === 0) {
    throw new HeyGenDiscoveryError(formatMissingMrJagGroupDiagnostic(groups));
  }
  if (groupMatches.length > 1) {
    const detail = groupMatches
      .map((g) => `- group_id=${g.id} status=${g.status ?? "n/a"}`)
      .join("\n");
    throw new HeyGenDiscoveryError(
      `Ambiguous avatar name "${TARGET_AVATAR_NAME}": multiple avatar groups matched.\n${detail}`
    );
  }

  const groupId = groupMatches[0]!.id;
  safeLog(
    `Discovering avatar looks for group ${groupId}...`,
    apiKeyHint
  );
  const looks = await client.listAllAvatarLooks({ groupId });

  safeLog("Discovering public voices...", apiKeyHint);
  const publicVoices = await client.listVoicesByType("public");
  safeLog("Discovering private voices...", apiKeyHint);
  const privateVoices = await client.listVoicesByType("private");
  const byId = new Map<string, (typeof publicVoices)[number]>();
  for (const item of [...publicVoices, ...privateVoices]) {
    if (item?.voice_id) byId.set(item.voice_id, item);
  }
  const voices = [...byId.values()];

  const avatar = resolveMrJagAvatar({ groups, looks });
  const voice = resolveSawyerVoice(voices);
  return { avatar, voice };
}

export async function runDiscoverAssetsCli(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
}): Promise<DiscoverAssetsResult> {
  const result = await discoverHeyGenAssets(deps);
  const apiKey = deps?.env?.HEYGEN_API_KEY ?? process.env.HEYGEN_API_KEY;
  safeLog(formatDiscoverAssetsReport(result), apiKey);
  safeLog(
    "\nDiscovery complete. No video was generated. IDs were NOT written to .env.local.",
    apiKey
  );
  return result;
}

/** Unverified candidate groups for scoped look inspection only — never auto-selected. */
export const CANDIDATE_AVATAR_GROUP_NAMES = ["Mark", "Jared"] as const;

export type CandidateLook = {
  readonly name: string;
  readonly lookId: string;
  readonly status: string | null;
  readonly avatarType: string | null;
};

export type CandidateGroupInspection = {
  readonly groupName: string;
  readonly groupId: string | null;
  readonly looks: readonly CandidateLook[];
  readonly note: string | null;
};

export type CandidateAvatarInspectionResult = {
  readonly candidates: readonly CandidateGroupInspection[];
  readonly explicitMrJagLookMatches: readonly {
    groupName: string;
    groupId: string;
    lookName: string;
    lookId: string;
  }[];
};

export function formatCandidateAvatarInspectionReport(
  result: CandidateAvatarInspectionResult
): string {
  const lines = ["=== HEYGEN CANDIDATE AVATAR INSPECTION ===", ""];
  for (const candidate of result.candidates) {
    lines.push(`Candidate: ${candidate.groupName}`);
    if (candidate.groupId == null) {
      lines.push("group_id=(not found)");
      lines.push("Looks:");
      lines.push(`- ${candidate.note ?? "No matching avatar group found."}`);
    } else {
      lines.push(`group_id=${candidate.groupId}`);
      if (candidate.note) {
        lines.push(`note: ${candidate.note}`);
      }
      lines.push("Looks:");
      if (candidate.looks.length === 0) {
        lines.push("- (none)");
      } else {
        for (const look of candidate.looks) {
          const status = look.status ?? "n/a";
          const type = look.avatarType ?? "n/a";
          lines.push(
            `- name="${look.name}" look_id=${look.lookId} status=${status} type=${type}`
          );
        }
      }
    }
    lines.push("");
  }
  lines.push("=== END INSPECTION ===");
  lines.push("");
  if (result.explicitMrJagLookMatches.length > 0) {
    lines.push("NAME MATCH(ES) for look name \"Mr. Jag\" (not auto-selected):");
    for (const match of result.explicitMrJagLookMatches) {
      lines.push(
        `- group="${match.groupName}" group_id=${match.groupId} look="${match.lookName}" look_id=${match.lookId}`
      );
    }
    lines.push(
      "These are exact look-name matches only. Visual/ownership verification is still required before use."
    );
  } else {
    lines.push(
      "No explicit Mr. Jag look-name match found. Visual verification is still required."
    );
  }
  return lines.join("\n");
}

export async function inspectCandidateAvatarLooks(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
  candidateNames?: readonly string[];
}): Promise<CandidateAvatarInspectionResult> {
  const { apiKey, baseUrl } = requireHeyGenApiKey(deps?.env);
  const client =
    deps?.client ??
    new HeyGenClient({
      apiKey,
      baseUrl,
    });
  const apiKeyHint = deps?.env?.HEYGEN_API_KEY ?? apiKey;
  const candidateNames = deps?.candidateNames ?? CANDIDATE_AVATAR_GROUP_NAMES;

  safeLog("Inspecting candidate avatar groups (read-only)...", apiKeyHint);
  let groups = await client.listAllAvatarGroups({ ownership: "private" });
  const missingOnPrivate = candidateNames.some(
    (name) => findExactNameMatches(groups, name).length === 0
  );
  if (missingOnPrivate) {
    safeLog("Listing avatar groups (all ownership)...", apiKeyHint);
    groups = await client.listAllAvatarGroups({});
  }

  const candidates: CandidateGroupInspection[] = [];
  const explicitMrJagLookMatches: Array<{
    groupName: string;
    groupId: string;
    lookName: string;
    lookId: string;
  }> = [];

  for (const groupName of candidateNames) {
    const matches = findExactNameMatches(groups, groupName);
    if (matches.length === 0) {
      candidates.push({
        groupName,
        groupId: null,
        looks: [],
        note: `No exact avatar group named "${groupName}" was found.`,
      });
      continue;
    }

    for (const group of matches) {
      const ambiguityNote =
        matches.length > 1
          ? `CANDIDATE ONLY — NOT VERIFIED AS MR. JAG (duplicate group name "${groupName}"; inspecting each group_id separately)`
          : "CANDIDATE ONLY — NOT VERIFIED AS MR. JAG";
      safeLog(
        `Fetching looks for candidate "${groupName}" (group_id=${group.id})...`,
        apiKeyHint
      );
      const looks = await client.listAllAvatarLooks({ groupId: group.id });
      const mappedLooks: CandidateLook[] = looks.map((look) => ({
        name: look.name,
        lookId: look.id,
        status: look.status ?? null,
        avatarType: look.avatar_type ?? null,
      }));
      for (const look of mappedLooks) {
        if (look.name === TARGET_AVATAR_NAME) {
          explicitMrJagLookMatches.push({
            groupName,
            groupId: group.id,
            lookName: look.name,
            lookId: look.lookId,
          });
        }
      }
      candidates.push({
        groupName,
        groupId: group.id,
        looks: mappedLooks,
        note: ambiguityNote,
      });
    }
  }

  return { candidates, explicitMrJagLookMatches };
}

export async function runInspectCandidateAvatarsCli(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
}): Promise<CandidateAvatarInspectionResult> {
  const result = await inspectCandidateAvatarLooks(deps);
  const apiKey = deps?.env?.HEYGEN_API_KEY ?? process.env.HEYGEN_API_KEY;
  safeLog(formatCandidateAvatarInspectionReport(result), apiKey);
  safeLog(
    "\nCandidate inspection complete. No video was generated. No avatar was selected. IDs were NOT written to .env.local.",
    apiKey
  );
  return result;
}

/** Known Mark/Jared group IDs from prior scoped inspection — never auto-selected. */
export const CANDIDATE_VISUAL_INSPECTION_GROUPS = [
  {
    groupName: "Mark",
    groupId: "373c671996b142aa9b085ed43fb0b660",
  },
  {
    groupName: "Mark",
    groupId: "3d406464d2c940df895758dd9cd87e3e",
  },
  {
    groupName: "Jared",
    groupId: "1348c67013e0469c89b303fbd25f4aaa",
  },
] as const;

export type CandidateLookVisualRow = {
  readonly groupName: string;
  readonly lookName: string;
  readonly lookId: string;
  readonly visualUrl: string | null;
};

export type CandidateLookVisualReport = {
  readonly rows: readonly CandidateLookVisualRow[];
  readonly totalLooks: number;
  readonly withVisualUrl: number;
  readonly withoutVisualUrl: number;
};

/** Prefer preview image; fall back to preview video. Never invent URLs. */
export function extractLookVisualUrl(look: {
  preview_image_url?: string | null;
  preview_video_url?: string | null;
}): string | null {
  const image = look.preview_image_url?.trim() ?? "";
  if (image) return image;
  const video = look.preview_video_url?.trim() ?? "";
  if (video) return video;
  return null;
}

export function formatCandidateLookVisualTable(
  report: CandidateLookVisualReport
): string {
  const lines = [
    "GROUP | LOOK NAME | LOOK ID | VISUAL URL AVAILABLE",
    "----- | --------- | ------- | --------------------",
  ];
  for (const row of report.rows) {
    const urlCell = row.visualUrl ?? "NO VISUAL URL IN RESPONSE";
    lines.push(
      `${row.groupName} | ${row.lookName} | ${row.lookId} | ${urlCell}`
    );
  }
  lines.push("");
  lines.push(`total looks inspected: ${report.totalLooks}`);
  lines.push(`with visual URLs: ${report.withVisualUrl}`);
  lines.push(`without visual URLs: ${report.withoutVisualUrl}`);
  return lines.join("\n");
}

export async function inspectCandidateLookVisuals(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
  groups?: readonly { groupName: string; groupId: string }[];
}): Promise<CandidateLookVisualReport> {
  const { apiKey, baseUrl } = requireHeyGenApiKey(deps?.env);
  const client =
    deps?.client ??
    new HeyGenClient({
      apiKey,
      baseUrl,
    });
  const apiKeyHint = deps?.env?.HEYGEN_API_KEY ?? apiKey;
  const groups = deps?.groups ?? CANDIDATE_VISUAL_INSPECTION_GROUPS;

  const rows: CandidateLookVisualRow[] = [];
  for (const group of groups) {
    safeLog(
      `Fetching visual URLs for ${group.groupName} (group_id=${group.groupId})...`,
      apiKeyHint
    );
    const looks = await client.listAllAvatarLooks({ groupId: group.groupId });
    for (const look of looks) {
      rows.push({
        groupName: group.groupName,
        lookName: look.name,
        lookId: look.id,
        visualUrl: extractLookVisualUrl(look),
      });
    }
  }

  const withVisualUrl = rows.filter((r) => r.visualUrl != null).length;
  return {
    rows,
    totalLooks: rows.length,
    withVisualUrl,
    withoutVisualUrl: rows.length - withVisualUrl,
  };
}

export async function runInspectCandidateLookVisualsCli(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
}): Promise<CandidateLookVisualReport> {
  const report = await inspectCandidateLookVisuals(deps);
  const apiKey = deps?.env?.HEYGEN_API_KEY ?? process.env.HEYGEN_API_KEY;
  safeLog(formatCandidateLookVisualTable(report), apiKey);
  safeLog(
    "\nVisual URL inspection complete. No video was generated. No avatar was selected.",
    apiKey
  );
  return report;
}

export type PrivateAvatarGroup = {
  readonly name: string;
  readonly groupId: string;
  /** Exact ownership field from the API response body (not inferred). */
  readonly ownership: string | null;
  readonly status: string | null;
  readonly previewImageUrl: string | null;
};

export type PrivateAvatarGroupsResult = {
  readonly groups: readonly PrivateAvatarGroup[];
  readonly exactMrJagMatches: readonly PrivateAvatarGroup[];
};

/** Names worth flagging for human review — never auto-selected. */
const POTENTIALLY_RELEVANT_PRIVATE_GROUP_NAMES = new Set([
  "Mr. Jag",
  "Mr. JAG",
  "MR. JAG",
  "Mr Jag",
  "Jared",
  "Mark",
]);

export function formatPrivateAvatarGroupsReport(
  result: PrivateAvatarGroupsResult
): string {
  const lines = [
    "=== PRIVATE HEYGEN AVATAR GROUPS ===",
    `Total private groups: ${result.groups.length}`,
    "",
  ];
  for (const g of result.groups) {
    lines.push(
      `${g.name} | group_id=${g.groupId} | ownership=${g.ownership ?? "(not in response)"} | status=${g.status ?? "n/a"}`
    );
  }
  lines.push("");
  if (result.exactMrJagMatches.length === 0) {
    lines.push('No exact "Mr. Jag" private avatar group found.');
  } else {
    lines.push('Exact "Mr. Jag" private avatar group match(es):');
    for (const g of result.exactMrJagMatches) {
      lines.push(`- ${g.name} | group_id=${g.groupId}`);
    }
  }
  const relevant = result.groups.filter((g) =>
    POTENTIALLY_RELEVANT_PRIVATE_GROUP_NAMES.has(g.name)
  );
  lines.push("");
  lines.push(
    "Potentially relevant private group names (NOT selected; for human review only):"
  );
  if (relevant.length === 0) {
    lines.push("(none)");
  } else {
    for (const g of relevant) {
      lines.push(`- ${g.name} | group_id=${g.groupId}`);
    }
  }
  lines.push("");
  lines.push("Looks were NOT retrieved. No video was generated.");
  return lines.join("\n");
}

/**
 * READ-ONLY: GET /v3/avatars?ownership=private only.
 * Does not call looks or videos endpoints. Does not merge public catalog.
 */
export async function discoverPrivateAvatarGroups(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
}): Promise<PrivateAvatarGroupsResult> {
  const { apiKey, baseUrl } = requireHeyGenApiKey(deps?.env);
  const client =
    deps?.client ??
    new HeyGenClient({
      apiKey,
      baseUrl,
    });
  const apiKeyHint = deps?.env?.HEYGEN_API_KEY ?? apiKey;

  safeLog(
    "Listing private avatar groups (GET /v3/avatars?ownership=private)...",
    apiKeyHint
  );
  const raw = await client.listAllAvatarGroups({ ownership: "private" });
  const groups: PrivateAvatarGroup[] = raw.map((g) => ({
    name: g.name,
    groupId: g.id,
    ownership:
      g.ownership != null && String(g.ownership).trim() !== ""
        ? String(g.ownership)
        : null,
    status: g.status ?? null,
    previewImageUrl: g.preview_image_url?.trim() || null,
  }));

  const exactMrJagMatches = groups.filter((g) => g.name === TARGET_AVATAR_NAME);
  return { groups, exactMrJagMatches };
}

export async function runDiscoverPrivateAvatarGroupsCli(deps?: {
  env?: NodeJS.ProcessEnv;
  client?: HeyGenClient;
}): Promise<PrivateAvatarGroupsResult> {
  const result = await discoverPrivateAvatarGroups(deps);
  const apiKey = deps?.env?.HEYGEN_API_KEY ?? process.env.HEYGEN_API_KEY;
  safeLog(formatPrivateAvatarGroupsReport(result), apiKey);
  return result;
}
