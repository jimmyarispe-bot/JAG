import {
  getProduct,
  isStudioSeeded,
  listProducts,
  markStudioSeeded,
  upsertProduct,
} from "../store";
import type { ReleaseStatus, StudioProduct, StudioProductId } from "../types";

const SEED: Omit<StudioProduct, "updatedAt">[] = [
  {
    id: "academyos",
    name: "AcademyOS",
    version: "1.0.0",
    completionPercent: 96,
    releaseStatus: "RC-3",
    dependencies: ["platform-sdk", "digital-twin", "connectors"],
    certification: "Pending",
    openPerIds: [],
    description:
      "Education industry pack — RC-3 operations readiness complete; Studio governs RC-4 advancement.",
  },
  {
    id: "healthcareos",
    name: "HealthcareOS",
    version: "0.0.0",
    completionPercent: 0,
    releaseStatus: "Development",
    dependencies: ["platform-sdk", "digital-twin"],
    certification: "None",
    openPerIds: [],
    description: "Future healthcare industry pack — built through Studio.",
  },
  {
    id: "governmentos",
    name: "GovernmentOS",
    version: "0.0.0",
    completionPercent: 0,
    releaseStatus: "Development",
    dependencies: ["platform-sdk", "digital-twin"],
    certification: "None",
    openPerIds: [],
    description: "Future government industry pack — built through Studio.",
  },
  {
    id: "manufacturingos",
    name: "ManufacturingOS",
    version: "0.0.0",
    completionPercent: 0,
    releaseStatus: "Development",
    dependencies: ["platform-sdk", "digital-twin"],
    certification: "None",
    openPerIds: [],
    description: "Future manufacturing industry pack — built through Studio.",
  },
];

export function ensureProductSeed(): void {
  if (isStudioSeeded() && listProducts().length > 0) return;
  const now = new Date().toISOString();
  for (const p of SEED) {
    if (!getProduct(p.id)) {
      upsertProduct({ ...p, updatedAt: now });
    }
  }
  markStudioSeeded();
}

export function createProductRegistryService() {
  return {
    ensureSeed: ensureProductSeed,
    list() {
      ensureProductSeed();
      return Object.freeze(listProducts());
    },
    get(id: StudioProductId) {
      ensureProductSeed();
      return getProduct(id);
    },
    upsert(input: {
      id: StudioProductId;
      name?: string;
      version?: string;
      completionPercent?: number;
      releaseStatus?: ReleaseStatus;
      dependencies?: readonly string[];
      certification?: StudioProduct["certification"];
      openPerIds?: readonly string[];
      description?: string;
    }): StudioProduct {
      ensureProductSeed();
      const current = getProduct(input.id);
      const now = new Date().toISOString();
      const next = upsertProduct({
        id: input.id,
        name: input.name ?? current?.name ?? input.id,
        version: input.version ?? current?.version ?? "0.0.0",
        completionPercent:
          input.completionPercent ?? current?.completionPercent ?? 0,
        releaseStatus: input.releaseStatus ?? current?.releaseStatus ?? "Development",
        dependencies: Object.freeze([
          ...(input.dependencies ?? current?.dependencies ?? []),
        ]),
        certification: input.certification ?? current?.certification ?? "None",
        openPerIds: Object.freeze([
          ...(input.openPerIds ?? current?.openPerIds ?? []),
        ]),
        description: input.description ?? current?.description ?? "",
        updatedAt: now,
      });
      return next;
    },
  };
}
