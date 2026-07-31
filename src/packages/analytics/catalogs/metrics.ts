/** Example metric keys — no calculations. */
export const ANALYTIC_METRIC_EXAMPLES = Object.freeze([
  Object.freeze({ id: "throughput", label: "Throughput" }),
  Object.freeze({ id: "completion_rate", label: "Completion Rate" }),
  Object.freeze({ id: "utilization", label: "Utilization" }),
  Object.freeze({ id: "cycle_time", label: "Cycle Time" }),
  Object.freeze({ id: "response_time", label: "Response Time" }),
  Object.freeze({ id: "compliance_rate", label: "Compliance Rate" }),
  Object.freeze({ id: "participation", label: "Participation" }),
  Object.freeze({ id: "growth", label: "Growth" }),
] as const);
