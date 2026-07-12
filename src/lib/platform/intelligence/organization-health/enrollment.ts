/**
 * Enrollment Health Engine
 *
 * Sprint 023
 */

export interface EnrollmentHealthResult {
    score: number;
    activeEnrollment: number;
    admissionsPipeline: number;
    capacity: number;
    utilization: number;
    status: "excellent" | "healthy" | "warning" | "critical";
  }
  
  export async function evaluateEnrollmentHealth(): Promise<EnrollmentHealthResult> {
    /**
     * Placeholder.
     * Sprint 024 will read from Admissions + SIS.
     */
  
    const activeEnrollment = 0;
    const admissionsPipeline = 0;
    const capacity = 100;
  
    const utilization =
      capacity === 0 ? 0 : (activeEnrollment / capacity) * 100;
  
    let score = Math.round(utilization);
  
    if (admissionsPipeline > 20) score += 10;
    if (score > 100) score = 100;
  
    let status: EnrollmentHealthResult["status"] = "excellent";
  
    if (score < 95) status = "healthy";
    if (score < 80) status = "warning";
    if (score < 60) status = "critical";
  
    return {
      score,
      activeEnrollment,
      admissionsPipeline,
      capacity,
      utilization,
      status,
    };
  }