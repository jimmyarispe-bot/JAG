/**
 * The school network's name, in the network's colour.
 *
 * One component rather than a colour repeated at every call site, because
 * "wherever the name appears" is a rule that only holds if there is one place
 * to change. It is also the reason this takes a `tone`: the same dark blue that
 * reads as the brand on a white page is invisible on the navy sidebar, so a
 * component that only knew one colour would either break contrast or quietly
 * get skipped in half the places it belongs.
 *
 * `light` is not a paler brand blue for a dim background — it is the legible
 * choice on a dark one. Accessibility outranks exactness here: a name nobody
 * can read is not branding.
 */

type Tone = "dark" | "light" | "inherit";

const TONE_CLASS: Record<Tone, string> = {
  /** Default. The network's dark blue, for white and near-white surfaces. */
  dark: "text-academy",
  /** For the navy sidebar and the indigo dashboard hero. */
  light: "text-white",
  /** Inside a heading that already sets its own colour deliberately. */
  inherit: "",
};

export function OrganizationName({
  name,
  tone = "dark",
  className = "",
}: {
  /** Already resolved by the caller — this component never fetches. */
  name: string;
  tone?: Tone;
  className?: string;
}) {
  return <span className={`${TONE_CLASS[tone]} ${className}`.trim()}>{name}</span>;
}
