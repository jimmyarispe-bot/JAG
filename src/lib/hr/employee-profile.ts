import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getRecruitingPipeline(supabase: AuthClient, schoolId?: string) {
  let jobsQuery = supabase.from("hr_job_postings").select("*").order("created_at", { ascending: false });
  if (schoolId) jobsQuery = jobsQuery.eq("school_id", schoolId);
  const { data: jobs } = await jobsQuery;

  const jobIds = (jobs ?? []).map((j) => j.id);
  const { data: applications } = jobIds.length
    ? await supabase.from("hr_job_applications").select("*").in("job_posting_id", jobIds).order("created_at", { ascending: false })
    : { data: [] };

  return { jobs: jobs ?? [], applications: applications ?? [] };
}

export async function getComplianceCenter(supabase: AuthClient, schoolId?: string) {
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];

  const certQuery = supabase
    .from("employee_certifications")
    .select("*, employees(school_id, employee_profiles(first_name, last_name))")
    .eq("status", "active")
    .not("expiration_date", "is", null)
    .lte("expiration_date", in90);

  const { data: expiringCerts } = await certQuery;
  const filteredCerts = schoolId
    ? (expiringCerts ?? []).filter((c) => (c.employees as { school_id?: string })?.school_id === schoolId)
    : expiringCerts ?? [];

  const onboardingQuery = supabase.from("hr_onboarding_tasks").select("*, employees(school_id)").neq("status", "completed");
  const { data: pendingOnboarding } = await onboardingQuery;
  const filteredOnboarding = schoolId
    ? (pendingOnboarding ?? []).filter((t) => (t.employees as { school_id?: string })?.school_id === schoolId)
    : pendingOnboarding ?? [];

  return {
    expiringCertifications: filteredCerts,
    pendingOnboarding: filteredOnboarding,
  };
}
