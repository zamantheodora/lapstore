"use client";

import type { Category } from "@/lib/types";
import { useLanguageContext } from "@/context/languageContext";
import { useProductsStore } from "@/store/useProductsStore";

type CategoryShortcut = {
  labelKey:
    | "shopByCategory.gaming.label"
    | "shopByCategory.school.label"
    | "shopByCategory.ultrabook.label"
    | "shopByCategory.business.label"
    | "shopByCategory.budget.label"
    | "shopByCategory.accessories.label";
  descriptionKey:
    | "shopByCategory.gaming.description"
    | "shopByCategory.school.description"
    | "shopByCategory.ultrabook.description"
    | "shopByCategory.business.description"
    | "shopByCategory.budget.description"
    | "shopByCategory.accessories.description";
  icon: React.ReactNode;
  apply: () => Partial<{
    category: Category | "";
    brand: string;
    maxPrice: number;
    minRamGb: 8 | 16 | 32;
    refreshHz: 0 | 60 | 120 | 144;
    sort: "price_asc" | "price_desc";
  }>;
};

const categoryShortcuts: CategoryShortcut[] = [
  {
    labelKey: "shopByCategory.gaming.label",
    descriptionKey: "shopByCategory.gaming.description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path d="M5 8h14l-1.2 7.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 12h3M10.5 10.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
    apply: () => ({ category: "gaming", refreshHz: 120 }),
  },
  {
    labelKey: "shopByCategory.school.label",
    descriptionKey: "shopByCategory.school.description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 7l8 4 8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    apply: () => ({ category: "school", maxPrice: 5500 }),
  },
  {
    labelKey: "shopByCategory.ultrabook.label",
    descriptionKey: "shopByCategory.ultrabook.description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect x="5" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    apply: () => ({ category: "ultrabook", sort: "price_asc" }),
  },
  {
    labelKey: "shopByCategory.business.label",
    descriptionKey: "shopByCategory.business.description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect x="4" y="5" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    apply: () => ({ category: "ultrabook", minRamGb: 16, brand: "Lenovo", sort: "price_desc" }),
  },
  {
    labelKey: "shopByCategory.budget.label",
    descriptionKey: "shopByCategory.budget.description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v8M9.5 10.5H14M9.5 13.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    apply: () => ({ category: "", maxPrice: 4500, sort: "price_asc" }),
  },
  {
    labelKey: "shopByCategory.accessories.label",
    descriptionKey: "shopByCategory.accessories.description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
        <rect x="7" y="4" width="10" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    apply: () => ({ category: "", sort: "price_asc" }),
  },
];

export default function ShopByCategory() {
  const { setFilters, fetch } = useProductsStore();
  const { t } = useLanguageContext();

  function handleSelect(shortcut: CategoryShortcut) {
    setFilters(shortcut.apply());
    void fetch();
    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section aria-labelledby="shop-by-category-heading" className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{t("shopByCategory.kicker")}</p>
          <h2 id="shop-by-category-heading" className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            {t("shopByCategory.title")}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {categoryShortcuts.map((shortcut) => (
          <button
            key={shortcut.labelKey}
            type="button"
            onClick={() => handleSelect(shortcut)}
            className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-sm"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              {shortcut.icon}
            </span>
            <p className="mt-3 text-sm font-semibold text-zinc-900">{t(shortcut.labelKey)}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">{t(shortcut.descriptionKey)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
