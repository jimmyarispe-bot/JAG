import {
  getEnvironmentIdentity,
  shouldShowBanner,
  type EnvironmentIdentity,
} from "@/lib/platform/environment/identity";

/**
 * A strip across the top of every page saying which environment and which
 * database you are looking at.
 *
 * Deliberately unmissable. The alternative — an interface that looks identical
 * on production and staging — cost hours on 25 Aug 2026 and came within one
 * click of writing 331 records into the wrong database.
 */

function tone(identity: EnvironmentIdentity) {
  if (identity.mismatch) {
    return {
      bar: "bg-rose-600 text-white",
      label: "CONFIGURATION MISMATCH",
    };
  }
  if (identity.unidentified) {
    return {
      bar: "bg-amber-500 text-amber-950",
      label: "UNIDENTIFIED DATABASE",
    };
  }
  if (identity.deployment === "preview") {
    return {
      bar: "bg-violet-600 text-white",
      label: "PREVIEW BUILD",
    };
  }
  return {
    bar: "bg-slate-800 text-white",
    label: identity.deployment.toUpperCase(),
  };
}

function message(identity: EnvironmentIdentity): string {
  if (identity.mismatch) {
    return identity.deployment === "production"
      ? `The production site is connected to ${identity.databaseName}. Do not enter real data.`
      : `A ${identity.deployment} build is connected to the PRODUCTION database. Anything you do here is real.`;
  }
  if (identity.unidentified) {
    return "This database has not been named. Run migration 226 and set its environment_name before trusting anything here.";
  }
  if (identity.deployment === "preview") {
    return "For testing code changes only — not for real records. Work that matters belongs on thejag.org.";
  }
  return "";
}

export async function EnvironmentBanner() {
  const identity = await getEnvironmentIdentity();
  if (!shouldShowBanner(identity)) return null;

  const { bar, label } = tone(identity);
  const note = message(identity);

  return (
    <div className={`${bar} px-4 py-2 text-sm`} role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded bg-black/25 px-2 py-0.5 text-xs font-bold tracking-wide">
          {label}
        </span>
        <span className="font-medium">
          {identity.databaseName ?? "database unreachable"}
          {identity.databaseRef ? (
            <span className="ml-1.5 font-mono text-xs opacity-80">
              {identity.databaseRef}
            </span>
          ) : null}
        </span>
        {note ? <span className="opacity-90">{note}</span> : null}
        {identity.commit ? (
          <span className="ml-auto font-mono text-xs opacity-70">{identity.commit}</span>
        ) : null}
      </div>
    </div>
  );
}
