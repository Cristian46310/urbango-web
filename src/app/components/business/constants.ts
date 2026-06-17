export const BUSINESS_PAGE_SIZE = 10;
/** ms-business rechaza limit > 100 (ver OpenAPI). */
export const BUSINESS_LOOKUP_PAGE_SIZE = 100;

export function formatShortId(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return value.slice(0, 8);
}

export function formatOptionalText(value: string | null | undefined, fallback = "—"): string {
  return value ?? fallback;
}

export function formatChartColor(index: number): string {
  return `var(--chart-${String((index % 5) + 1)})`;
}
