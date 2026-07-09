import type {
  UlrAtomicSkillDefinition,
  UlrCompetencyDefinition,
  UlrLearningDomain,
  UlrRelationship,
  UlrRegistrySnapshot,
  UlrStrand,
  UlrSubStrand,
} from "@/lib/platform/ulr/types";

const DOMAINS = new Map<string, UlrLearningDomain>();
const STRANDS = new Map<string, UlrStrand>();
const SUB_STRANDS = new Map<string, UlrSubStrand>();
const COMPETENCIES = new Map<string, UlrCompetencyDefinition>();
const SKILLS = new Map<string, UlrAtomicSkillDefinition>();
const RELATIONSHIPS: UlrRelationship[] = [];
let registered = false;

export function registerUlrDomain(domain: UlrLearningDomain): void {
  DOMAINS.set(domain.domainKey, domain);
}

export function registerUlrStrand(strand: UlrStrand): void {
  STRANDS.set(strand.strandKey, strand);
}

export function registerUlrSubStrand(subStrand: UlrSubStrand): void {
  SUB_STRANDS.set(subStrand.subStrandKey, subStrand);
}

export function registerUlrCompetency(competency: UlrCompetencyDefinition): void {
  COMPETENCIES.set(competency.competencyKey, competency);
}

export function registerUlrAtomicSkill(skill: UlrAtomicSkillDefinition): void {
  SKILLS.set(skill.skillKey, skill);
}

export function registerUlrRelationship(relationship: UlrRelationship): void {
  RELATIONSHIPS.push(relationship);
}

export function getUlrDomain(domainKey: string): UlrLearningDomain | undefined {
  return DOMAINS.get(domainKey);
}

export function getUlrStrand(strandKey: string): UlrStrand | undefined {
  return STRANDS.get(strandKey);
}

export function getUlrSubStrand(subStrandKey: string): UlrSubStrand | undefined {
  return SUB_STRANDS.get(subStrandKey);
}

export function getUlrCompetency(competencyKey: string): UlrCompetencyDefinition | undefined {
  return COMPETENCIES.get(competencyKey);
}

export function getUlrAtomicSkill(skillKey: string): UlrAtomicSkillDefinition | undefined {
  return SKILLS.get(skillKey);
}

export function getAllUlrDomains(): UlrLearningDomain[] {
  return [...DOMAINS.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getUlrStrandsByDomain(domainKey: string): UlrStrand[] {
  return [...STRANDS.values()]
    .filter((strand) => strand.domainKey === domainKey)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getUlrSubStrandsByStrand(strandKey: string): UlrSubStrand[] {
  return [...SUB_STRANDS.values()]
    .filter((subStrand) => subStrand.strandKey === strandKey)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getUlrCompetenciesBySubStrand(subStrandKey: string): UlrCompetencyDefinition[] {
  return [...COMPETENCIES.values()].filter(
    (competency) => competency.subStrandKey === subStrandKey
  );
}

export function getAllUlrCompetencies(): UlrCompetencyDefinition[] {
  return [...COMPETENCIES.values()];
}

export function getAllUlrAtomicSkills(): UlrAtomicSkillDefinition[] {
  return [...SKILLS.values()];
}

export function getUlrAtomicSkillsByCompetency(competencyKey: string): UlrAtomicSkillDefinition[] {
  return [...SKILLS.values()].filter((skill) => skill.competencyKey === competencyKey);
}

export function getUlrRelationships(filters?: {
  sourceKey?: string;
  targetKey?: string;
  relationshipType?: string;
}): UlrRelationship[] {
  let rows = [...RELATIONSHIPS];
  if (filters?.sourceKey) {
    rows = rows.filter((row) => row.sourceKey === filters.sourceKey);
  }
  if (filters?.targetKey) {
    rows = rows.filter((row) => row.targetKey === filters.targetKey);
  }
  if (filters?.relationshipType) {
    rows = rows.filter((row) => row.relationshipType === filters.relationshipType);
  }
  return rows;
}

export function isKnownUlrCompetencyKey(key: string): boolean {
  return COMPETENCIES.has(key);
}

export function isKnownUlrSkillKey(key: string): boolean {
  return SKILLS.has(key);
}

export function getUlrRegistrySnapshot(): UlrRegistrySnapshot {
  return {
    domains: getAllUlrDomains(),
    strands: [...STRANDS.values()],
    subStrands: [...SUB_STRANDS.values()],
    competencies: getAllUlrCompetencies(),
    atomicSkills: getAllUlrAtomicSkills(),
    relationships: [...RELATIONSHIPS],
    registeredAt: new Date().toISOString(),
  };
}

export function isUlrRegistryRegistered(): boolean {
  return registered;
}

export function markUlrRegistryRegistered(): void {
  registered = true;
}

export function clearUlrRegistryForTests(): void {
  DOMAINS.clear();
  STRANDS.clear();
  SUB_STRANDS.clear();
  COMPETENCIES.clear();
  SKILLS.clear();
  RELATIONSHIPS.length = 0;
  registered = false;
}
