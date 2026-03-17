import type { Product } from "@/lib/types";

export type ProductScores = {
  performance: number;
  portability: number;
  battery: number;
  value: number;
};

export function clampScore(value: number): number {
  return Math.max(35, Math.min(99, Math.round(value)));
}

export function getProductScores(product: Product): ProductScores {
  const performance = clampScore(product.ram_gb * 1.6 + (product.refresh_hz ?? 60) * 0.22 + product.storage_gb * 0.03);
  const portability = clampScore(95 - product.weight_kg * 18 - product.screen_inches * 1.6);
  const battery = clampScore(product.battery_hours * 8.4 - product.screen_inches * 1.2);
  const value = clampScore(95 - product.price / 190 + product.ram_gb * 0.9 + product.storage_gb * 0.03);

  return { performance, portability, battery, value };
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "supplier";

export function getStockStatus(product: Product): StockStatus {
  const mod = product.id % 9;
  if (mod === 0) return "out_of_stock";
  if (mod === 1 || mod === 2) return "low_stock";
  if (mod === 3) return "supplier";
  return "in_stock";
}

export function getStockLabel(status: StockStatus): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "out_of_stock":
      return "Out of stock";
    case "supplier":
      return "Supplier stock";
    default:
      return "In stock";
  }
}

export function getEstimatedDeliveryDays(product: Product): string {
  const status = getStockStatus(product);
  if (status === "in_stock") return "Delivery in 1-2 days";
  if (status === "low_stock") return "Delivery in 2-4 days";
  if (status === "supplier") return "Delivery in 5-8 days";
  return "Delivery ETA unavailable";
}

export function hasPriceDrop(product: Product): boolean {
  return product.id % 4 === 0;
}

export function monthlyPayment(product: Product): number {
  return Math.round(product.price / 24);
}

export function getProsAndCons(product: Product): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];

  if (product.ram_gb >= 16) pros.push("Great multitasking memory");
  if ((product.refresh_hz ?? 60) >= 120) pros.push("High refresh smooth display");
  if (product.battery_hours >= 9) pros.push("Long battery life");
  if (product.weight_kg <= 1.5) pros.push("Very portable design");
  if (product.storage_gb >= 1000) pros.push("Large SSD capacity");

  if (product.weight_kg > 2.1) cons.push("Heavier than ultraportable models");
  if (product.battery_hours < 7) cons.push("Battery life below premium average");
  if ((product.refresh_hz ?? 60) < 120 && product.category === "gaming") cons.push("Refresh rate may be limiting for competitive gaming");
  if (product.storage_gb < 512) cons.push("Storage may fill quickly");

  return {
    pros: pros.slice(0, 4),
    cons: cons.slice(0, 3),
  };
}

export function recommendedUseCases(product: Product): string[] {
  const tags: string[] = [];
  if (product.category === "school") tags.push("Students", "Daily productivity");
  if (product.category === "gaming") tags.push("Gamers", "Streaming & media");
  if (product.category === "ultrabook") tags.push("Business travel", "Creative work");
  if (product.battery_hours >= 10) tags.push("Remote work");
  if (product.weight_kg <= 1.4) tags.push("On-the-go users");
  return Array.from(new Set(tags)).slice(0, 4);
}
