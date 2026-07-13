import { createAreaIntelligence } from "@/lib/platform/intelligence/reputation/area-factory";
export class EmployeeReputationIntelligence extends createAreaIntelligence("employee_reputation", ["Employee reputation signal", "Internal advocacy gap"], "Employee Reputation") {}
