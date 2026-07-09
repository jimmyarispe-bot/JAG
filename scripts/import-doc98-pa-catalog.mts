/**
 * One-time import: Document 98 → ULR PA competency catalog JSON.
 * Run: npx tsx scripts/import-doc98-pa-catalog.mts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DOC98_PATH = resolve(
  "docs/governance/jag-knowledge-system/competency-libraries/98-FOUNDATIONAL-PHONOLOGICAL-AWARENESS-COMPETENCY-LIBRARY.md"
);
const OUT_PATH = resolve(
  "src/lib/platform/ulr/catalog/structured-literacy/competencies/foundational-pa/doc98-import.json"
);

const GROUP_TO_SUB_STRAND: Record<string, string> = {
  "pa.competency.sentence_segmentation": "domain.structured_literacy.sub_strand.sentence_awareness",
  "pa.competency.syllable_blend": "domain.structured_literacy.sub_strand.syllable_awareness",
  "pa.competency.syllable_segment": "domain.structured_literacy.sub_strand.syllable_awareness",
  "pa.competency.syllable_manipulate": "domain.structured_literacy.sub_strand.syllable_awareness",
  "pa.competency.rhyme_recognition": "domain.structured_literacy.sub_strand.rhyme_alliteration",
  "pa.competency.onset_rime_blend": "domain.structured_literacy.sub_strand.onset_rime_awareness",
  "pa.competency.onset_rime_segment": "domain.structured_literacy.sub_strand.onset_rime_awareness",
  "pa.competency.phoneme_readiness": "domain.structured_literacy.sub_strand.phoneme_readiness_bridge",
};

function parseField(section: string, field: string): string | null {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const row = new RegExp(`\\|\\s*\`${escaped}\`\\s*\\|\\s*([^|\\n]+?)\\s*\\|`, "m");
  const match = section.match(row);
  if (!match?.[1]) return null;
  const raw = match[1].trim();
  const backtick = raw.match(/^`([^`]+)`$/);
  return backtick ? backtick[1]! : raw.replace(/^`|`$/g, "");
}

function parseKeyList(value: string | null): string[] {
  if (!value || value === "[]" || value.includes("— entry")) return [];
  const keys = value.match(/AW-SL-PA-\d{3}-v[\d.]+/g) ?? [];
  return [...new Set(keys)];
}

function parseCommaList(value: string | null): string[] {
  if (!value || value === "[]") return [];
  return value
    .split(",")
    .map((part) => part.trim().replace(/^`|`$/g, ""))
    .filter(Boolean);
}

function parseAtomicSkillPlaceholders(section: string): Array<{ key: string; title: string }> {
  const block = section.match(/#### 4\.11 Future Atomic Skill References[\s\S]*?(?=\n---|\n## |$)/);
  if (!block) return [];
  const rows: Array<{ key: string; title: string }> = [];
  const lineRe = /\|\s*`(AW-SL-PA-\d+-AS-\d+-v[\d.]+)`\s*\|\s*([^|]+?)\s*\|/g;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(block[0])) !== null) {
    rows.push({ key: m[1]!, title: m[2]!.trim() });
  }
  return rows;
}

function expandSkillRefs(raw: string, competencyKey: string): string[] {
  const compPrefix = competencyKey.replace(/-v[\d.]+$/, "");
  const keys: string[] = raw.match(/AW-SL-PA-\d+-AS-\d+-v[\d.]+/g) ?? [];
  const shortKeys = raw.match(/AS-\d{3}/g) ?? [];
  for (const short of shortKeys) {
    keys.push(`${compPrefix}-${short}-v1.0.0`);
  }
  const through = raw.match(/through `AS-(\d+)`/i);
  if (through) {
    const max = Number.parseInt(through[1]!, 10);
    for (let i = 1; i <= max; i += 1) {
      keys.push(`${compPrefix}-AS-${String(i).padStart(3, "0")}-v1.0.0`);
    }
  }
  return [...new Set(keys)];
}

function parseFutureSkillRefs(section: string, competencyKey: string): Array<{ key: string; title: string }> {
  const fromTable = parseAtomicSkillPlaceholders(section);
  const inline = parseField(section, "future_atomic_skill_refs[]");
  const keys = inline ? expandSkillRefs(inline, competencyKey) : [];
  const merged = new Map<string, { key: string; title: string }>();
  for (const row of fromTable) merged.set(row.key, row);
  for (const key of keys) {
    if (!merged.has(key)) {
      const titleMatch = inline?.match(new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(([^)]+)\\)`));
      merged.set(key, {
        key,
        title: titleMatch?.[1] ?? key.split("-AS-")[1]?.replace(/-v.*/, "") ?? "PLACEHOLDER",
      });
    }
  }
  return [...merged.values()];
}

function parseSuccessCriteria(section: string): string[] {
  const block = section.match(/\*\*Success criteria:\*\*([\s\S]*?)(?=\n\n|\*\*Observable|\| Field |####)/);
  if (!block) return [];
  return block[1]!
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("|"));
}

const content = readFileSync(DOC98_PATH, "utf8");
const parts = content.split(/### Competency (AW-SL-PA-\d+-v[\d.]+)/);

interface ImportedCompetency {
  competencyKey: string;
  title: string;
  titleEducator?: string;
  description: string;
  purpose: string;
  whyItMatters: string;
  developmentalNotes: string;
  competencyGroupKey: string;
  subStrandKey: string;
  conceptKeys: string[];
  prerequisiteCompetencyKeys: string[];
  prerequisiteRationale?: string;
  nextCompetencyKeys: string[];
  evidenceTypes: string[];
  assessmentMethods: string[];
  minimumEvidenceCount: number;
  instructionalStrategies: string[];
  interventionStrategies: string[];
  parentActivities: string[];
  aiCoachingRuleKeys: string[];
  schedulingRuleKeys: string[];
  cumulativeReviewKeys: string[];
  executiveFunctionDemand: string;
  portfolioEligible: boolean;
  transcriptEligible: boolean;
  futureAtomicSkillRefs: Array<{ key: string; title: string }>;
  successCriteria: string[];
  crossDomainLinks: Array<{ targetKey: string; linkType: string; rationale?: string }>;
}

const competencies: ImportedCompetency[] = [];

for (let i = 1; i < parts.length; i += 2) {
  const competencyKey = parts[i]!;
  const section = parts[i + 1] ?? "";
  const titleLine = section.split("\n")[0]?.trim() ?? "";
  const title = titleLine.replace(/^—\s*/, "");

  const competencyGroupKey = parseField(section, "competency_group_key") ?? "";
  const subStrandKey =
    parseField(section, "sub_strand_key") ??
    GROUP_TO_SUB_STRAND[competencyGroupKey] ??
    "domain.structured_literacy.sub_strand.syllable_awareness";

  const prereqRaw = parseField(section, "prerequisite_competency_keys[]");
  const nextRaw = parseField(section, "next_competency_keys[]");

  competencies.push({
    competencyKey,
    title: parseField(section, "title") ?? title,
    titleEducator: parseField(section, "title_educator") ?? undefined,
    description: parseField(section, "description") ?? "",
    purpose: parseField(section, "purpose") ?? "",
    whyItMatters: parseField(section, "why_it_matters") ?? "",
    developmentalNotes: parseField(section, "developmental_notes") ?? "",
    competencyGroupKey,
    subStrandKey,
    conceptKeys: parseCommaList(parseField(section, "concept_keys[]")),
    prerequisiteCompetencyKeys: parseKeyList(prereqRaw),
    prerequisiteRationale: parseField(section, "prerequisite_rationale") ?? undefined,
    nextCompetencyKeys: parseKeyList(nextRaw),
    evidenceTypes: parseCommaList(parseField(section, "evidence_type_keys[]")),
    assessmentMethods: parseCommaList(parseField(section, "assessment_method_keys[]")),
    minimumEvidenceCount: Number.parseInt(parseField(section, "minimum_evidence_count") ?? "2", 10),
    instructionalStrategies: parseCommaList(parseField(section, "instructional_strategy_keys[]")),
    interventionStrategies: parseCommaList(parseField(section, "intervention_strategy_keys[]")),
    parentActivities: parseCommaList(parseField(section, "parent_activity_refs[]")),
    aiCoachingRuleKeys: parseCommaList(parseField(section, "ai_coaching_rule_keys[]")),
    schedulingRuleKeys: parseCommaList(parseField(section, "scheduling_rule_keys[]")),
    cumulativeReviewKeys: parseKeyList(parseField(section, "cumulative_review_keys[]")),
    executiveFunctionDemand: parseField(section, "executive_function_demand") ?? "moderate",
    portfolioEligible: parseField(section, "portfolio_eligible") === "true",
    transcriptEligible: parseField(section, "transcript_eligible") === "true",
    futureAtomicSkillRefs: parseFutureSkillRefs(section, competencyKey),
    successCriteria: parseSuccessCriteria(section),
    crossDomainLinks: [],
  });
}

mkdirSync(resolve(OUT_PATH, ".."), { recursive: true });
writeFileSync(
  OUT_PATH,
  JSON.stringify(
    {
      libraryKey: "competency_library.foundational_phonological_awareness",
      documentRef: "DOCUMENT-98",
      version: "1.0.0",
      competencyCount: competencies.length,
      competencies,
    },
    null,
    2
  )
);

console.log(`Imported ${competencies.length} competencies → ${OUT_PATH}`);
