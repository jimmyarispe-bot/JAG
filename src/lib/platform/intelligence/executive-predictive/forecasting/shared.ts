import type {
  ForecastAssumption,
  ForecastSubject,
  HistoricalSignal,
} from "@/lib/platform/intelligence/executive-predictive/types";

export interface SubjectBaseline {
  subject: ForecastSubject;
  value: number;
  unit: string;
  assumptions: ForecastAssumption[];
}

const DEFAULTS: Record<
  ForecastSubject,
  { value: number; unit: string; assumptions: string[] }
> = {
  enrollment: {
    value: 100,
    unit: "students",
    assumptions: [
      "Inquiry volume remains within seasonal norms",
      "No major competitor opening nearby",
    ],
  },
  revenue: {
    value: 1_000_000,
    unit: "USD",
    assumptions: [
      "Tuition rates hold for the forecast horizon",
      "Collections lag stays near historical average",
    ],
  },
  cash: {
    value: 250_000,
    unit: "USD",
    assumptions: [
      "Payroll and vendor cadence unchanged",
      "No unplanned capital outlay",
    ],
  },
  staffing: {
    value: 40,
    unit: "FTE",
    assumptions: [
      "Attrition stays near trailing average",
      "Hiring pipeline capacity is available",
    ],
  },
  retention: {
    value: 0.92,
    unit: "ratio",
    assumptions: [
      "Academic and support quality remain stable",
      "No abrupt policy shocks for families",
    ],
  },
  parent_satisfaction: {
    value: 0.8,
    unit: "ratio",
    assumptions: [
      "Communication cadence continues",
      "No unresolved cluster of service failures",
    ],
  },
  operations: {
    value: 70,
    unit: "workload_index",
    assumptions: [
      "Ticket and session volume track enrollment",
      "No major system outage",
    ],
  },
  compliance: {
    value: 0.88,
    unit: "ratio",
    assumptions: [
      "Regulatory calendar is known",
      "Evidence collection capacity holds",
    ],
  },
};

export function subjectSignals(
  subject: ForecastSubject,
  signals: HistoricalSignal[]
): HistoricalSignal[] {
  return signals.filter(
    (s) => s.subject === subject || s.domain === subject || s.subject.includes(subject)
  );
}

export function resolveBaseline(
  subject: ForecastSubject,
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
): SubjectBaseline {
  const def = DEFAULTS[subject];
  const relevant = subjectSignals(subject, signals);
  const value =
    relevant.length > 0
      ? relevant.reduce((sum, s) => sum + s.value, 0) / relevant.length
      : def.value;

  return {
    subject,
    value,
    unit: def.unit,
    assumptions: def.assumptions.map((statement, i) => ({
      id: createId(`assume-${subject}-${i}`),
      statement,
      critical: i === 0,
    })),
  };
}

/** Positive delta = improving for most subjects; operations/compliance invert carefully. */
export function directionFor(
  subject: ForecastSubject,
  delta: number
): "improving" | "degrading" | "stable" | "mixed" {
  if (Math.abs(delta) < 1e-6) return "stable";
  const higherIsBetter = ![
    "operations",
  ].includes(subject);
  if (higherIsBetter) {
    return delta > 0 ? "improving" : "degrading";
  }
  return delta < 0 ? "improving" : "degrading";
}

export function trendSlope(signals: HistoricalSignal[]): number {
  if (signals.length === 0) return 0;
  if (signals.length === 1) {
    if (signals[0].direction === "up") return 0.02;
    if (signals[0].direction === "down") return -0.02;
    return 0;
  }
  const sorted = [...signals].sort((a, b) => a.at.localeCompare(b.at));
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  if (first === 0) return last === 0 ? 0 : Math.sign(last) * 0.05;
  return (last - first) / Math.abs(first);
}
