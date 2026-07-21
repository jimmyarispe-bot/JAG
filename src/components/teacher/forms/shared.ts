export type StudentOption = { id: string; first_name?: string; last_name?: string };

export function linesToJsonArray(text: string): string {
  return JSON.stringify(
    text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  );
}

export const inputClass = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
