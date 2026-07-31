import {
  createMemoryCacheProvider,
  type CacheProvider,
} from "@/applications/academyos/infrastructure/cache";
import {
  createFixedClockProvider,
  createSystemClockProvider,
  type ClockProvider,
} from "@/applications/academyos/infrastructure/clock";
import {
  loadInfrastructureConfiguration,
  type InfrastructureConfiguration,
} from "@/applications/academyos/infrastructure/configuration";
import {
  createMemoryDatabaseProvider,
  createSupabaseDatabaseProvider,
  type DatabaseProvider,
  type SupabaseLikeClient,
} from "@/applications/academyos/infrastructure/database";
import {
  createDocumentStorageProvider,
  type DocumentStorageProvider,
} from "@/applications/academyos/infrastructure/documents";
import {
  createMemoryEmailProvider,
  createResendEmailProvider,
  type EmailProvider,
} from "@/applications/academyos/infrastructure/email";
import {
  createJagIdentityProvider,
  createStaticIdentityProvider,
  type IdentityProvider,
} from "@/applications/academyos/infrastructure/identity";
import {
  createTransactionCoordinator,
  type TransactionCoordinator,
} from "@/applications/academyos/infrastructure/persistence";
import {
  createMemoryQueueProvider,
  type QueueProvider,
} from "@/applications/academyos/infrastructure/queue";
import {
  createMemorySearchProvider,
  createStubSearchProvider,
  type SearchProvider,
} from "@/applications/academyos/infrastructure/search";
import {
  createMemoryStorageProvider,
  createSupabaseStorageProvider,
  type StorageProvider,
  type SupabaseStorageLikeClient,
} from "@/applications/academyos/infrastructure/storage";

export type AcademyInfrastructure = {
  config: InfrastructureConfiguration;
  database: DatabaseProvider;
  transactions: TransactionCoordinator;
  storage: StorageProvider;
  documents: DocumentStorageProvider;
  email: EmailProvider;
  search: SearchProvider;
  cache: CacheProvider;
  queue: QueueProvider;
  identity: IdentityProvider;
  clock: ClockProvider;
};

export type CreateInfrastructureOptions = {
  config?: Partial<InfrastructureConfiguration>;
  supabaseClient?: SupabaseLikeClient;
  supabaseStorageClient?: SupabaseStorageLikeClient;
  database?: DatabaseProvider;
  storage?: StorageProvider;
  documents?: DocumentStorageProvider;
  email?: EmailProvider;
  search?: SearchProvider;
  cache?: CacheProvider;
  queue?: QueueProvider;
  identity?: IdentityProvider;
  clock?: ClockProvider;
};

function createDatabase(
  config: InfrastructureConfiguration,
  options: CreateInfrastructureOptions
): DatabaseProvider {
  if (options.database) return options.database;
  if (config.persistenceDriver === "supabase") {
    if (!options.supabaseClient) {
      throw new Error(
        "Supabase persistence requires an injected supabaseClient in composition."
      );
    }
    return createSupabaseDatabaseProvider(options.supabaseClient);
  }
  return createMemoryDatabaseProvider();
}

function createEmail(
  config: InfrastructureConfiguration,
  options: CreateInfrastructureOptions
): EmailProvider {
  if (options.email) return options.email;
  if (config.emailDriver === "resend") return createResendEmailProvider();
  if (config.emailDriver === "none") {
    return {
      id: "none",
      async send() {
        return { success: false, provider: "none", error: "Email disabled" };
      },
    };
  }
  return createMemoryEmailProvider();
}

export function createAcademyInfrastructure(
  options: CreateInfrastructureOptions = {}
): AcademyInfrastructure {
  const config = loadInfrastructureConfiguration(options.config);
  const database = createDatabase(config, options);
  const storage =
    options.storage ??
    (config.storageDriver === "supabase" && options.supabaseStorageClient
      ? createSupabaseStorageProvider(options.supabaseStorageClient)
      : createMemoryStorageProvider());
  const search =
    options.search ??
    (config.searchDriver === "memory"
      ? createMemorySearchProvider()
      : createStubSearchProvider());
  const identity =
    options.identity ??
    (config.identityDriver === "static"
      ? createStaticIdentityProvider()
      : createJagIdentityProvider());
  const clock =
    options.clock ??
    (process.env.NODE_ENV === "test"
      ? createFixedClockProvider()
      : createSystemClockProvider());

  return {
    config,
    database,
    transactions: createTransactionCoordinator(database),
    storage,
    documents:
      options.documents ?? createDocumentStorageProvider(storage),
    email: createEmail(config, options),
    search,
    cache: options.cache ?? createMemoryCacheProvider(),
    queue: options.queue ?? createMemoryQueueProvider(),
    identity,
    clock,
  };
}
