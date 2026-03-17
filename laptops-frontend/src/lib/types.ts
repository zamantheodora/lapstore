export type Category = "gaming" | "school" | "ultrabook";

export type SortOption = "price_asc" | "price_desc";

export type Product = {
  id: number;
  cover_photo: string;
  images?: string[];
  title: string;
  description: string;
  price: number;
  brand: string;
  cpu: string;
  ram_gb: number;
  storage_gb: number;
  gpu: string;
  screen_inches: number;
  weight_kg: number;
  battery_hours: number;
  os: string;
  category: Category;
  resolution: string;
  refresh_hz?: number | null;
};

export type ChatFilters = {
  q?: string | null;
  brand?: string | null;
  category?: Category | null;
  os?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_ram_gb?: number | null;
  min_storage_gb?: number | null;
  min_screen_inches?: number | null;
  max_weight_kg?: number | null;
  gpu?: string | null;
  refresh_hz?: number | null;
  sort_by?: SortOption | null;
};

export type ChatResponse = {
  assistant_message: string;
  filters: ChatFilters;
  results: Product[];
  clarifying_question?: string | null;
  quick_actions?: { label: string; prompt: string }[] | null;
};
