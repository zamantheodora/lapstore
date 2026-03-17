export function formatPriceRon(value: number): string {
  try {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value)} RON`;
  }
}

export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function toIntOrUndefined(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
