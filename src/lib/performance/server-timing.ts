/**
 * Sprint P001 — Server-Timing helpers (instrumentation only).
 * Collects named durations and serializes to the Server-Timing header.
 */

export type ServerTimingMark = {
  name: string;
  durationMs: number;
  description?: string;
};

export class ServerTimingCollector {
  private marks: ServerTimingMark[] = [];

  async measure<T>(name: string, fn: () => Promise<T> | T, description?: string): Promise<T> {
    const start =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    try {
      return await fn();
    } finally {
      const end =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      this.marks.push({
        name,
        durationMs: Math.round((end - start) * 100) / 100,
        description,
      });
    }
  }

  add(name: string, durationMs: number, description?: string) {
    this.marks.push({
      name,
      durationMs: Math.round(durationMs * 100) / 100,
      description,
    });
  }

  list(): ServerTimingMark[] {
    return [...this.marks];
  }

  headerValue(): string {
    return this.marks
      .map((m) => {
        const desc = m.description ? `;desc="${m.description.replace(/"/g, "")}"` : "";
        return `${m.name};dur=${m.durationMs}${desc}`;
      })
      .join(", ");
  }

  apply(headers: Headers) {
    if (this.marks.length === 0) return;
    const existing = headers.get("Server-Timing");
    const next = this.headerValue();
    headers.set("Server-Timing", existing ? `${existing}, ${next}` : next);
  }
}
