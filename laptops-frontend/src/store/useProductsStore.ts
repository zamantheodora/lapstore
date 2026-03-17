import { create } from "zustand";

import { loadAdminProductsFromStorage, loadDeletedProductIdsFromStorage } from "@/lib/adminProducts";
import { getStockStatus } from "@/lib/productInsights";
import type { Category, Product, SortOption } from "@/lib/types";
import { searchProducts } from "@/lib/api";

export type HomeFilters = {
  q: string;
  category: Category | "";
  brand: string;
  cpuBrand: "" | "intel" | "amd" | "apple";
  gpu: "" | "integrated" | "nvidia" | "amd";
  usageType: "" | "student" | "creator" | "gaming" | "business";
  availability: "" | "in_stock" | "low_stock" | "out_of_stock" | "supplier";
  minScreenInches: number;
  maxWeightKg: number;
  minBatteryHours: number;
  maxPrice: number;
  minRamGb: 8 | 16 | 32;
  refreshHz: 0 | 60 | 120 | 144;
  sort: SortOption;
};

type ProductsState = {
  filters: HomeFilters;
  isLoading: boolean;
  error: string | null;
  products: Product[];
  savedSearches: string[];
  setFilters: (patch: Partial<HomeFilters>) => void;
  saveSearch: (label: string) => void;
  removeSavedSearch: (label: string) => void;
  fetch: () => Promise<void>;
};

const defaultFilters: HomeFilters = {
  q: "",
  category: "",
  brand: "",
  cpuBrand: "",
  gpu: "",
  usageType: "",
  availability: "",
  minScreenInches: 11,
  maxWeightKg: 3.5,
  minBatteryHours: 0,
  maxPrice: 12000,
  minRamGb: 8,
  refreshHz: 0,
  sort: "price_asc",
};

const SAVED_SEARCHES_KEY = "lapstore-saved-searches-v1";

function clientMatchesFilters(product: Product, filters: HomeFilters): boolean {
  const text = `${product.title} ${product.brand} ${product.cpu} ${product.gpu}`.toLowerCase();
  const q = filters.q.trim().toLowerCase();
  if (q && !text.includes(q)) return false;

  if (filters.cpuBrand === "intel" && !product.cpu.toLowerCase().includes("intel")) return false;
  if (filters.cpuBrand === "amd" && !product.cpu.toLowerCase().includes("amd")) return false;
  if (filters.cpuBrand === "apple" && !product.cpu.toLowerCase().includes("apple")) return false;

  if (filters.gpu === "integrated" && !product.gpu.toLowerCase().includes("intel") && !product.gpu.toLowerCase().includes("integrated")) return false;
  if (filters.gpu === "nvidia" && !product.gpu.toLowerCase().includes("nvidia")) return false;
  if (filters.gpu === "amd" && !product.gpu.toLowerCase().includes("amd")) return false;

  if (product.screen_inches < filters.minScreenInches) return false;
  if (product.weight_kg > filters.maxWeightKg) return false;
  if (product.battery_hours < filters.minBatteryHours) return false;

  if (filters.usageType === "student" && !(product.category === "school" || product.price <= 5500)) return false;
  if (filters.usageType === "creator" && !(product.ram_gb >= 16 && product.storage_gb >= 512)) return false;
  if (filters.usageType === "gaming" && product.category !== "gaming") return false;
  if (filters.usageType === "business" && !(product.category === "ultrabook" && product.weight_kg <= 1.7)) return false;

  if (filters.availability) {
    const status = getStockStatus(product);
    if (status !== filters.availability) return false;
  }

  return true;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  filters: defaultFilters,
  isLoading: false,
  error: null,
  products: [],
  savedSearches: typeof window !== "undefined" ? JSON.parse(window.localStorage.getItem(SAVED_SEARCHES_KEY) || "[]") : [],

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),

  saveSearch: (label) => {
    if (!label.trim()) return;
    set((s) => {
      const next = [label.trim(), ...s.savedSearches.filter((x) => x !== label.trim())].slice(0, 8);
      if (typeof window !== "undefined") window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
      return { savedSearches: next };
    });
  },

  removeSavedSearch: (label) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    set((s) => {
      const next = s.savedSearches.filter((item) => item !== trimmed);
      if (typeof window !== "undefined") window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(next));
      return { savedSearches: next };
    });
  },

  fetch: async () => {
    const { filters } = get();
    set({ isLoading: true, error: null });

    try {
      const results = await searchProducts({
        brand: filters.brand || undefined,
        category: filters.category || undefined,
        max_price: filters.maxPrice,
        min_ram_gb: filters.minRamGb,
        refresh_hz: filters.refreshHz === 0 ? undefined : filters.refreshHz,
        limit: 100,
        sort: filters.sort,
      });

      const localAdminProducts = loadAdminProductsFromStorage();
      const deletedIds = new Set(loadDeletedProductIdsFromStorage());
      const mergedById = new Map<number, Product>();
      results.forEach((product) => {
        if (!deletedIds.has(product.id)) mergedById.set(product.id, product);
      });
      localAdminProducts.forEach((product) => {
        if (!deletedIds.has(product.id)) mergedById.set(product.id, product);
      });

      const merged = Array.from(mergedById.values());
      const filtered = merged.filter((product) => clientMatchesFilters(product, filters));

      if (filters.sort === "price_asc") filtered.sort((a, b) => a.price - b.price);
      if (filters.sort === "price_desc") filtered.sort((a, b) => b.price - a.price);

      set({ products: filtered, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load products";
      set({ isLoading: false, error: msg });
    }
  },
}));
