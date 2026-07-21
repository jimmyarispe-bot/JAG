/**
 * Merge `field_*` FormData entries into a config section payload.
 */

export function mergeConfigFieldsFromFormData(
  formData: FormData,
  existing: Record<string, unknown> = {}
): { configData: Record<string, unknown>; fieldKeys: string[] } {
  const configData: Record<string, unknown> = { ...existing };
  const fieldKeys: string[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    const fieldKey = key.slice("field_".length);
    configData[fieldKey] = value.toString();
    fieldKeys.push(fieldKey);
  }

  return { configData, fieldKeys };
}
