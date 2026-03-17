import type { Category, Product } from "@/lib/types";

export const ADMIN_PRODUCTS_STORAGE_KEY = "lapstore-admin-products-v1";
export const ADMIN_DELETED_PRODUCTS_STORAGE_KEY = "lapstore-admin-deleted-products-v1";

export type ProductFormValues = {
  title: string;
  description: string;
  price: string;
  brand: string;
  cpu: string;
  gpu: string;
  ram_gb: string;
  storage_gb: string;
  screen_inches: string;
  refresh_hz: string;
  battery_hours: string;
  weight_kg: string;
  resolution: string;
  os: string;
  category: Category;
  imageDataUrl?: string;
};

export function createEmptyProductForm(): ProductFormValues {
  return {
    title: "",
    description: "",
    price: "",
    brand: "",
    cpu: "",
    gpu: "",
    ram_gb: "16",
    storage_gb: "512",
    screen_inches: "14",
    refresh_hz: "60",
    battery_hours: "8",
    weight_kg: "1.4",
    resolution: "1920x1200",
    os: "Windows 11",
    category: "ultrabook",
  };
}

function toNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value: string, fallback = 0): number {
  return Math.round(toNumber(value, fallback));
}

export function mapFormToProduct(values: ProductFormValues, id: number): Product {
  const image = values.imageDataUrl || "/laptop-placeholder.svg";

  return {
    id,
    cover_photo: image,
    images: [image],
    title: values.title.trim(),
    description: values.description.trim(),
    price: toNumber(values.price, 0),
    brand: values.brand.trim(),
    cpu: values.cpu.trim(),
    ram_gb: toInteger(values.ram_gb, 8),
    storage_gb: toInteger(values.storage_gb, 256),
    gpu: values.gpu.trim(),
    screen_inches: toNumber(values.screen_inches, 14),
    weight_kg: toNumber(values.weight_kg, 1.5),
    battery_hours: toNumber(values.battery_hours, 8),
    os: values.os.trim(),
    category: values.category,
    resolution: values.resolution.trim(),
    refresh_hz: toInteger(values.refresh_hz, 60),
  };
}

export function mapProductToForm(product: Product): ProductFormValues {
  return {
    title: product.title,
    description: product.description,
    price: String(product.price),
    brand: product.brand,
    cpu: product.cpu,
    gpu: product.gpu,
    ram_gb: String(product.ram_gb),
    storage_gb: String(product.storage_gb),
    screen_inches: String(product.screen_inches),
    refresh_hz: String(product.refresh_hz ?? 60),
    battery_hours: String(product.battery_hours),
    weight_kg: String(product.weight_kg),
    resolution: product.resolution,
    os: product.os,
    category: product.category,
    imageDataUrl: product.images?.[0] || product.cover_photo || "/laptop-placeholder.svg",
  };
}

export function getNextProductId(products: Product[]): number {
  if (products.length === 0) return 1;
  return Math.max(...products.map((product) => product.id)) + 1;
}

export function isProductFormValid(values: ProductFormValues): boolean {
  return [values.title, values.description, values.price, values.brand, values.cpu, values.gpu].every(
    (field) => field.trim().length > 0
  );
}

export function loadAdminProductsFromStorage(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ADMIN_PRODUCTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "number" && typeof item.title === "string");
  } catch {
    return [];
  }
}

export function saveAdminProductsToStorage(products: Product[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

export function loadDeletedProductIdsFromStorage(): number[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ADMIN_DELETED_PRODUCTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

export function saveDeletedProductIdsToStorage(ids: number[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_DELETED_PRODUCTS_STORAGE_KEY, JSON.stringify(ids));
}
