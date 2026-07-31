/** Example policy families — industry blueprints decide which exist. */
export const POLICY_FAMILY_EXAMPLES = Object.freeze([
  Object.freeze({ id: "policy", label: "Policy" }),
  Object.freeze({ id: "standard", label: "Standard" }),
  Object.freeze({ id: "procedure", label: "Procedure" }),
  Object.freeze({ id: "guideline", label: "Guideline" }),
  Object.freeze({ id: "control", label: "Control" }),
] as const);
