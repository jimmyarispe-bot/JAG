/**
 * JAG Experience — shell/chrome ownership namespace.
 * Implementation remains under `src/components/experience-system` and WDS during migration.
 */
export type JagExperienceShellPort = {
  /** Application packages must not own sidebar behavior. */
  navigationSource: "jag";
};
