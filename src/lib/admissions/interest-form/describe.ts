/**
 * Saying, in English, when a section or a question appears.
 *
 * A form definition stores visibility as a condition tree - `{ all: [{ path:
 * "school_id", op: "eq", value: "3f2c..." }] }`. That is exactly right for a
 * renderer and useless to the person deciding whether the Georgia scholarship
 * section shows for Georgia families, which is the question actually being
 * asked when somebody opens the form builder.
 *
 * PURE, AND SEPARATE FROM THE SCREEN, so the phrasing can be tested without a
 * database or a browser. Every label it cannot resolve falls back to the raw
 * value rather than to silence: an unreadable rule that is visibly unreadable
 * can be fixed, and one that quietly prints nothing reads as "always shown",
 * which is the most dangerous wrong answer this function could give.
 */

import type {
  FormCondition,
  FormConditionGroup,
} from "@/lib/platform/forms/types";

/** Names for the opaque ids a condition compares against - school uuids, mostly. */
export type ConditionLabels = {
  /** id -> human name. Anything missing prints as the id, never as blank. */
  readonly values?: Readonly<Record<string, string>>;
  /** question key -> that question's label. */
  readonly paths?: Readonly<Record<string, string>>;
};

const isGroup = (node: FormCondition | FormConditionGroup): node is FormConditionGroup =>
  typeof node === "object" && node !== null && ("all" in node || "any" in node);

function nameValue(value: unknown, labels: ConditionLabels): string {
  if (Array.isArray(value)) {
    return value.map((v) => nameValue(v, labels)).join(" or ");
  }
  const raw = value === null || value === undefined ? "" : String(value);
  if (raw === "") return "(blank)";
  return labels.values?.[raw] ?? raw;
}

function namePath(path: string, labels: ConditionLabels): string {
  return labels.paths?.[path] ?? path;
}

function describeOne(condition: FormCondition, labels: ConditionLabels): string {
  const subject = namePath(condition.path, labels);

  switch (condition.op) {
    case "eq":
      return `${subject} is ${nameValue(condition.value, labels)}`;
    case "neq":
      return `${subject} is not ${nameValue(condition.value, labels)}`;
    case "in":
      return `${subject} is ${nameValue(condition.value, labels)}`;
    case "contains":
      return `${subject} includes ${nameValue(condition.value, labels)}`;
    case "exists":
      return `${subject} has been answered`;
    case "empty":
      return `${subject} has not been answered`;
    case "gt":
      return `${subject} is more than ${nameValue(condition.value, labels)}`;
    case "gte":
      return `${subject} is at least ${nameValue(condition.value, labels)}`;
    case "lt":
      return `${subject} is less than ${nameValue(condition.value, labels)}`;
    case "lte":
      return `${subject} is at most ${nameValue(condition.value, labels)}`;
    default:
      /* An operator this function has not been taught. Printed rather than
         dropped - see the note at the top about silence. */
      return `${subject} ${String(condition.op)} ${nameValue(condition.value, labels)}`;
  }
}

/**
 * One sentence for a whole condition tree, or null when there is no condition
 * at all - which the caller should render as "always shown", in those words.
 */
export function describeCondition(
  group: FormConditionGroup | null | undefined,
  labels: ConditionLabels = {}
): string | null {
  if (!group) return null;

  const parts: string[] = [];

  const render = (
    nodes: ReadonlyArray<FormCondition | FormConditionGroup> | undefined,
    joiner: " and " | " or "
  ): string | null => {
    if (!nodes || nodes.length === 0) return null;
    const pieces = nodes
      .map((node) => (isGroup(node) ? describeCondition(node, labels) : describeOne(node, labels)))
      .filter((piece): piece is string => Boolean(piece));
    if (pieces.length === 0) return null;
    if (pieces.length === 1) return pieces[0];
    return pieces.join(joiner);
  };

  const all = render(group.all, " and ");
  const any = render(group.any, " or ");

  if (all) parts.push(all);
  if (any) parts.push(parts.length > 0 ? `(${any})` : any);

  if (parts.length === 0) return null;
  return parts.join(" and ");
}
