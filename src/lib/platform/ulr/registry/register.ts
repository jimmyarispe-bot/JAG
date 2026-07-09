import {
  ULR_PRODUCTION_DOMAINS,
  ULR_REFERENCE_ATOMIC_SKILLS,
  ULR_REFERENCE_COMPETENCIES,
  ULR_REFERENCE_RELATIONSHIPS,
  ULR_REFERENCE_STRANDS,
  ULR_REFERENCE_SUB_STRANDS,
} from "@/lib/platform/ulr/catalog/reference-catalog";
import {
  markUlrRegistryRegistered,
  registerUlrAtomicSkill,
  registerUlrCompetency,
  registerUlrDomain,
  registerUlrRelationship,
  registerUlrStrand,
  registerUlrSubStrand,
} from "@/lib/platform/ulr/registry/registry";

for (const domain of ULR_PRODUCTION_DOMAINS) registerUlrDomain(domain);
for (const strand of ULR_REFERENCE_STRANDS) registerUlrStrand(strand);
for (const subStrand of ULR_REFERENCE_SUB_STRANDS) registerUlrSubStrand(subStrand);
for (const competency of ULR_REFERENCE_COMPETENCIES) registerUlrCompetency(competency);
for (const skill of ULR_REFERENCE_ATOMIC_SKILLS) registerUlrAtomicSkill(skill);
for (const relationship of ULR_REFERENCE_RELATIONSHIPS) registerUlrRelationship(relationship);

markUlrRegistryRegistered();
