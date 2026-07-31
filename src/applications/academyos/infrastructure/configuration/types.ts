export type InfrastructurePersistenceDriver = "null" | "memory" | "supabase";

export type InfrastructureEmailDriver = "memory" | "resend" | "none";

export type InfrastructureConfiguration = {
  persistenceDriver: InfrastructurePersistenceDriver;
  emailDriver: InfrastructureEmailDriver;
  storageDriver: "memory" | "supabase";
  searchDriver: "stub" | "memory";
  cacheDriver: "memory";
  queueDriver: "memory";
  identityDriver: "jag" | "static";
};
