export const ULR_ENGINE_VERSION = "1.0.0";

export const ULR_DOMAIN_CODES: Record<string, string> = {
  "domain.structured_literacy": "SL",
  "domain.real_life_math": "RLM",
  "domain.litlab": "LL",
  "domain.earthology": "EO",
  "domain.life_lab": "LLB",
  "domain.ai_venture_lab": "AVL",
};

const COMPETENCY_KEY_RE =
  /^AW-(SL|RLM|LL|EO|LLB|AVL)-[A-Z0-9_-]+-\d{3}-v\d+\.\d+\.\d+$/;

const SKILL_KEY_RE =
  /^AW-(SL|RLM|LL|EO|LLB|AVL)-[A-Z0-9_-]+-(AS-\d+|S\d{2,3})-v\d+\.\d+\.\d+$/;

export function isValidUlrCompetencyKey(key: string): boolean {
  return COMPETENCY_KEY_RE.test(key);
}

export function isValidUlrSkillKey(key: string): boolean {
  return SKILL_KEY_RE.test(key) || COMPETENCY_KEY_RE.test(key);
}

export function resolveDomainCode(domainKey: string): string | undefined {
  return ULR_DOMAIN_CODES[domainKey];
}
