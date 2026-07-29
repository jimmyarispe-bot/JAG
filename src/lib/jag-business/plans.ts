/** Subscription plans — placeholder pricing (no payments). */

export const JAG_SUBSCRIPTION_PLANS = Object.freeze([
  Object.freeze({
    id: "starter",
    name: "Starter",
    tagline: "Small organizations",
    priceLabel: "$499 / month",
    features: Object.freeze([
      "1 organization workspace",
      "Core platform modules",
      "Email support",
    ]),
  }),
  Object.freeze({
    id: "professional",
    name: "Professional",
    tagline: "Growing organizations",
    priceLabel: "$1,499 / month",
    features: Object.freeze([
      "Multiple workspaces",
      "Priority support",
      "Advanced reporting",
    ]),
  }),
  Object.freeze({
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom pricing",
    priceLabel: "Contact sales",
    features: Object.freeze([
      "Unlimited scale",
      "Dedicated success partner",
      "Custom contracts & SLA",
    ]),
  }),
]);

export type JagSubscriptionPlanId =
  (typeof JAG_SUBSCRIPTION_PLANS)[number]["id"];

export function getSubscriptionPlan(id: string) {
  return JAG_SUBSCRIPTION_PLANS.find((p) => p.id === id);
}
