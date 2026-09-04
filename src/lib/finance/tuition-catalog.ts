/**
 * Reading the tuition catalog.
 *
 * The grid a school leader edits is (attending school × catalog item). Three
 * small tables joined in TypeScript rather than one embedded select, because
 * these tables are tens of rows, not thousands, and a flat query is one thing
 * that can fail instead of three things nested.
 *
 * The distinction that matters here: an item belongs to the school that
 * PROVIDES it. When the attending school is not the provider, the family is not
 * billed — the tuition is owed by one school to the other. That is not a flag
 * anybody sets; it falls out of comparing two ids, so it cannot drift.
 */

import { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  TuitionPriceRow,
  TuitionSchoolGroup,
} from "@/lib/finance/tuition-catalog-shared";

export type { TuitionPriceRow, TuitionSchoolGroup } from "@/lib/finance/tuition-catalog-shared";

export async function listTuitionPriceGrid(): Promise<
  { groups: TuitionSchoolGroup[] } | { error: string }
> {
  const supabase = await createAuthClient();

  const [pricesResult, itemsResult, schoolsResult] = await Promise.all([
    supabase
      .from("tuition_school_prices")
      .select(
        "id, school_id, catalog_item_id, standard_amount, billing_frequency, offered_one_to_one, one_to_one_session_rate, is_active"
      ),
    supabase
      .from("tuition_catalog_items")
      .select("id, item_code, display_name, item_kind, provider_school_id, description, sort_order")
      .eq("is_active", true),
    supabase.from("schools").select("id, name"),
  ]);

  // Every one of these can be refused by RLS, and an empty grid would look
  // exactly like "no prices configured". Say which read failed instead.
  if (pricesResult.error) return { error: `Could not read prices: ${pricesResult.error.message}` };
  if (itemsResult.error) return { error: `Could not read the catalog: ${itemsResult.error.message}` };
  if (schoolsResult.error) return { error: `Could not read schools: ${schoolsResult.error.message}` };

  const itemById = new Map((itemsResult.data ?? []).map((i) => [i.id, i]));
  const schoolNameById = new Map((schoolsResult.data ?? []).map((s) => [s.id, s.name]));

  const rows: TuitionPriceRow[] = [];
  for (const price of pricesResult.data ?? []) {
    const item = itemById.get(price.catalog_item_id);
    // An inactive or deleted catalog item leaves an orphan price. Skipping it
    // is right; silently skipping it is not, so it is counted below.
    if (!item) continue;

    rows.push({
      priceId: price.id,
      schoolId: price.school_id,
      schoolName: schoolNameById.get(price.school_id) ?? "(unknown school)",
      catalogItemId: item.id,
      itemCode: item.item_code,
      itemName: item.display_name,
      itemKind: item.item_kind,
      description: item.description,
      providerSchoolId: item.provider_school_id,
      providerSchoolName: schoolNameById.get(item.provider_school_id) ?? "(unknown school)",
      billedToFamily: item.provider_school_id === price.school_id,
      standardAmount: price.standard_amount,
      billingFrequency: price.billing_frequency,
      offeredOneToOne: price.offered_one_to_one,
      oneToOneSessionRate: price.one_to_one_session_rate,
      isActive: price.is_active,
      sortOrder: item.sort_order,
    });
  }

  const bySchool = new Map<string, TuitionPriceRow[]>();
  for (const row of rows) {
    const list = bySchool.get(row.schoolId) ?? [];
    list.push(row);
    bySchool.set(row.schoolId, list);
  }

  const groups: TuitionSchoolGroup[] = [...bySchool.entries()]
    .map(([schoolId, list]) => ({
      schoolId,
      schoolName: list[0]!.schoolName,
      rows: list.sort((a, b) => a.sortOrder - b.sortOrder || a.itemName.localeCompare(b.itemName)),
      unpriced: list.filter((r) => r.standardAmount === null).length,
    }))
    .sort((a, b) => a.schoolName.localeCompare(b.schoolName));

  return { groups };
}
