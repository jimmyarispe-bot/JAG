/**
 * Pure merge helpers for blueprint materialization.
 */

function byKey<T>(
  items: readonly T[] | undefined,
  keyOf: (item: T) => string
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items ?? []) {
    map.set(keyOf(item), item);
  }
  return map;
}

/** Organization entries override industry entries with the same key. */
export function mergeByKey<T>(
  industry: readonly T[] | undefined,
  organization: readonly T[] | undefined,
  keyOf: (item: T) => string
): T[] {
  const map = byKey(industry, keyOf);
  for (const item of organization ?? []) {
    map.set(keyOf(item), item);
  }
  return [...map.values()];
}

export function mergeTerminology(
  industry: readonly { id: string; label: string; terms: Readonly<Record<string, string>> }[] | undefined,
  organization: readonly { id: string; label: string; terms: Readonly<Record<string, string>> }[] | undefined
) {
  const map = new Map<
    string,
    { id: string; label: string; terms: Record<string, string> }
  >();
  for (const pack of industry ?? []) {
    map.set(pack.id, {
      id: pack.id,
      label: pack.label,
      terms: { ...pack.terms },
    });
  }
  for (const pack of organization ?? []) {
    const prev = map.get(pack.id);
    map.set(pack.id, {
      id: pack.id,
      label: pack.label || prev?.label || pack.id,
      terms: { ...(prev?.terms ?? {}), ...pack.terms },
    });
  }
  return [...map.values()].map((p) =>
    Object.freeze({
      id: p.id,
      label: p.label,
      terms: Object.freeze({ ...p.terms }),
    })
  );
}

export function mergeDocumentBundles(
  industry:
    | {
        categories?: readonly { id: string }[];
        definitions?: readonly { id: string }[];
        templates?: readonly { id: string }[];
      }
    | undefined,
  organization:
    | {
        categories?: readonly { id: string }[];
        definitions?: readonly { id: string }[];
        templates?: readonly { id: string }[];
      }
    | undefined
) {
  const categories = mergeByKey(
    industry?.categories as { id: string }[] | undefined,
    organization?.categories as { id: string }[] | undefined,
    (c) => c.id
  );
  const definitions = mergeByKey(
    industry?.definitions as { id: string }[] | undefined,
    organization?.definitions as { id: string }[] | undefined,
    (d) => d.id
  );
  const templates = mergeByKey(
    industry?.templates as { id: string }[] | undefined,
    organization?.templates as { id: string }[] | undefined,
    (t) => t.id
  );
  if (!categories.length && !definitions.length && !templates.length) {
    return undefined;
  }
  return Object.freeze({
    categories: categories.length ? Object.freeze(categories) : undefined,
    definitions: Object.freeze(definitions),
    templates: templates.length ? Object.freeze(templates) : undefined,
  });
}

export function mergeCommunicationBundles(
  industry:
    | {
        definitions?: readonly { id: string }[];
        templates?: readonly { id: string }[];
      }
    | undefined,
  organization:
    | {
        definitions?: readonly { id: string }[];
        templates?: readonly { id: string }[];
      }
    | undefined
) {
  const definitions = mergeByKey(
    industry?.definitions as { id: string }[] | undefined,
    organization?.definitions as { id: string }[] | undefined,
    (d) => d.id
  );
  const templates = mergeByKey(
    industry?.templates as { id: string }[] | undefined,
    organization?.templates as { id: string }[] | undefined,
    (t) => t.id
  );
  if (!definitions.length && !templates.length) return undefined;
  return Object.freeze({
    definitions: Object.freeze(definitions),
    templates: Object.freeze(templates),
  });
}
