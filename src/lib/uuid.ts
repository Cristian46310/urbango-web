/** UUID v1–v5 (strict hex + version/variant bits). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_RE.test(value.trim());
}

export function assertUuid(value: string, label = "id"): string {
  const trimmed = value.trim();
  if (!isUuid(trimmed)) {
    throw new Error(`${label} debe ser un UUID válido`);
  }
  return trimmed;
}
