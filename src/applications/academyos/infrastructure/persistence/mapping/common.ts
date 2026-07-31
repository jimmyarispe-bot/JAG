import type { DatabaseRow } from "@/applications/academyos/infrastructure/database";
import {
  asNullableNumber,
  asNullableString,
  asNumber,
  asString,
} from "@/applications/academyos/infrastructure/persistence/serialization";

export { asNullableNumber, asNullableString, asNumber, asString };

export function requireId(row: DatabaseRow): string {
  const id = asString(row.id);
  if (!id) throw new Error("Persistence row missing id");
  return id;
}
