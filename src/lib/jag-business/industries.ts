export const JAG_INDUSTRIES = Object.freeze([
  Object.freeze({
    id: "education",
    name: "Education",
    productName: "AcademyOS",
    available: true,
  }),
  Object.freeze({
    id: "healthcare",
    name: "Healthcare",
    productName: "HealthcareOS",
    available: false,
  }),
  Object.freeze({
    id: "government",
    name: "Government",
    productName: "GovernmentOS",
    available: false,
  }),
  Object.freeze({
    id: "manufacturing",
    name: "Manufacturing",
    productName: "ManufacturingOS",
    available: false,
  }),
  Object.freeze({
    id: "nonprofit",
    name: "Nonprofit",
    productName: "NonprofitOS",
    available: false,
  }),
]);

export type JagIndustryId = (typeof JAG_INDUSTRIES)[number]["id"];

export function getIndustry(id: string) {
  return JAG_INDUSTRIES.find((i) => i.id === id);
}
