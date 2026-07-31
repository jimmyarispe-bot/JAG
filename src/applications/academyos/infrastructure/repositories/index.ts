/**
 * Compatibility surface — production implementations live under
 * `infrastructure/persistence/supabase/repositories`.
 */
export { createProductionRepositories as createSupabaseRepositories } from "@/applications/academyos/infrastructure/persistence/supabase";
export type { InfrastructureRepositories } from "@/applications/academyos/infrastructure/repositories/types";
