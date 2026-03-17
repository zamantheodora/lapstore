import type { ChatResponse, Product, SortOption } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const PRODUCT_IMAGE_FILES = new Set<string>([
  "apple-macbook-air-13-m4-1.jpg",
  "apple-macbook-air-13-m4-2.jpg",
  "apple-macbook-air-13-m4-3.jpg",
  "acer-nitro-16-an16-42-1.jpg",
  "acer-nitro-16-an16-42-2.jpg",
  "acer-nitro-16-an16-42-3.jpg",
  "acer-swift-go-14-1.jpg",
  "acer-swift-go-14-2.jpg",
  "acer-swift-go-14-3.jpg",
  "asus-zenbook-14-oled-ux3405-1.jpg",
  "asus-zenbook-14-oled-ux3405-2.jpg",
  "asus-zenbook-14-oled-ux3405-3.jpg",
  "asus-rog-zephyrus-g14-2024-1.jpg",
  "asus-rog-zephyrus-g14-2024-2.jpg",
  "dell-inspiron-14-7440-1.jpg",
  "dell-inspiron-14-7440-2.jpg",
  "dell-inspiron-14-7440-3.jpg",
  "dell-xps-13-9340-1.jpg",
  "dell-xps-13-9340-2.jpg",
  "hp-pavilion-plus-14-1.jpg",
  "hp-pavilion-plus-14-2.jpg",
  "hp-pavilion-plus-14-3.jpg",
  "hp-omen-16-wf-1.jpg",
  "hp-omen-16-wf-2.jpg",
  "hp-omen-16-wf-3.jpg",
  "hp-spectre-x360-14-1.jpg",
  "hp-spectre-x360-14-2.jpg",
  "lenovo-ideapad-slim-5-14-gen9-1.jpg",
  "lenovo-ideapad-slim-5-14-gen9-2.jpg",
  "lenovo-ideapad-slim-5-14-gen9-3.jpg",
  "lenovo-legion-5i-gen9-16irx9-1.jpg",
  "lenovo-legion-5i-gen9-16irx9-2.jpg",
  "lenovo-thinkpad-x1-carbon-gen12-1.jpg",
  "lenovo-thinkpad-x1-carbon-gen12-2.jpg",
  "lenovo-thinkpad-x1-carbon-gen12-3.jpg",
  "microsoft-surface-laptop-7-13-8-1.jpg",
  "microsoft-surface-laptop-7-13-8-2.jpg",
  "microsoft-surface-laptop-7-13-8-3.jpg",
  "msi-katana-15-b13v-1.jpg",
  "msi-katana-15-b13v-2.jpg",
  "msi-katana-15-b13v-3.jpg",
]);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function requireBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Create laptops-frontend/.env.local and set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000"
    );
  }
  return API_BASE_URL;
}

async function httpGet<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
  const base = requireBaseUrl();
  const url = new URL(path, base);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `Request failed: ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

function resolveLocalProductImages(coverPhoto: string | null | undefined): string[] {
  if (!coverPhoto) return ["/laptop-placeholder.svg"];
  const filename = coverPhoto.split("/").pop()?.split("?")[0];
  if (!filename) return ["/laptop-placeholder.svg"];

  if (PRODUCT_IMAGE_FILES.has(filename)) {
    return [`/images/products/${filename}`];
  }

  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot) : "";
  const base = dot >= 0 ? filename.slice(0, dot) : filename;
  const variantNames = [`${base}-1${ext}`, `${base}-2${ext}`, `${base}-3${ext}`];
  const variants = variantNames
    .filter((name) => PRODUCT_IMAGE_FILES.has(name))
    .map((name) => `/images/products/${name}`);

  if (variants.length > 0) return variants;
  return ["/laptop-placeholder.svg"];
}

function mapProductImage(product: Product): Product {
  const images = resolveLocalProductImages(product.cover_photo);
  return {
    ...product,
    images,
  };
}

function mapChatResponseImages(response: ChatResponse): ChatResponse {
  return {
    ...response,
    results: response.results.map(mapProductImage),
  };
}

async function httpPost<T>(path: string, body: unknown): Promise<T> {
  const base = requireBaseUrl();
  const url = new URL(path, base);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `Request failed: ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

export type SearchParams = {
  q?: string;
  brand?: string;
  category?: string;
  os?: string;
  min_price?: number;
  max_price?: number;
  min_ram_gb?: number;
  min_storage_gb?: number;
  min_screen_inches?: number;
  max_weight_kg?: number;
  gpu?: string;
  refresh_hz?: number;
  skip?: number;
  limit?: number;
  sort?: SortOption;
};

export async function listProducts(): Promise<Product[]> {
  const products = await httpGet<Product[]>("/api/v1/products");
  return products.map(mapProductImage);
}

export async function getProduct(id: number): Promise<Product> {
  const product = await httpGet<Product>(`/api/v1/products/${id}`);
  return mapProductImage(product);
}

export async function searchProducts(params: SearchParams): Promise<Product[]> {
  const { sort, ...rest } = params;
  const products = (await httpGet<Product[]>("/api/v1/products/search", rest)).map(mapProductImage);

  if (sort === "price_asc") return [...products].sort((a, b) => a.price - b.price);
  if (sort === "price_desc") return [...products].sort((a, b) => b.price - a.price);
  return products;
}

export async function chat(message: string, session_id: string, language?: "ro" | "en"): Promise<ChatResponse> {
  const response = await httpPost<ChatResponse>("/api/v1/chat", { message, session_id, language });
  return mapChatResponseImages(response);
}
