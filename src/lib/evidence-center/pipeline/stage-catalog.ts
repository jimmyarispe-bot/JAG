import {
  PROCESSING_STAGES,
  type ProcessingStageCatalogEntry,
} from "@/lib/evidence-center/pipeline/types";

/** Static stage catalog — processors are placeholders until future sprints. */
export const PROCESSING_STAGE_CATALOG: readonly ProcessingStageCatalogEntry[] =
  Object.freeze(
    PROCESSING_STAGES.map((name, index) =>
      Object.freeze({
        id: `stage.${index + 1}.${name.toLowerCase().replace(/\s+/g, "_")}`,
        name,
        sortOrder: index + 1,
        placeholder: name !== "Upload Complete",
        description:
          name === "Virus Scan"
            ? "Placeholder virus scan — not executed this sprint."
            : name === "Classification"
              ? "Placeholder classification — no AI this sprint."
              : name === "Ready for Intelligence"
                ? "Marks evidence ready for future Executive Intelligence."
                : `${name} orchestration step.`,
      })
    )
  );
