export const BUSINESS_PAGE_SIZE = 10;
export const BUSINESS_LOOKUP_PAGE_SIZE = 200;

export function formatShortId(value: string): string {
  return value.slice(0, 8);
}

export function formatOptionalText(value: string | null | undefined, fallback = "—"): string {
  return value ?? fallback;
}

export function formatChartColor(index: number): string {
  return `var(--chart-${String((index % 5) + 1)})`;
}
