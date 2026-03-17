"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useConfirm } from "@/context/confirmContext";
import { useLanguageContext } from "@/context/languageContext";
import { useToast } from "@/context/toastContext";
import type { TranslationKey } from "@/i18n/en";
import type { Category } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { useProductsStore } from "@/store/useProductsStore";

const categories: Array<{ value: Category | ""; labelKey: TranslationKey }> = [
  { value: "", labelKey: "filters.category.all" },
  { value: "gaming", labelKey: "filters.category.gaming" },
  { value: "school", labelKey: "filters.usageType.student" },
  { value: "ultrabook", labelKey: "filters.category.ultrabook" },
];

const brands = ["Acer", "Lenovo", "HP", "Asus", "Dell", "MSI"];

const defaultFilters = {
  q: "",
  category: "" as Category | "",
  brand: "",
  cpuBrand: "" as "" | "intel" | "amd" | "apple",
  gpu: "" as "" | "integrated" | "nvidia" | "amd",
  usageType: "" as "" | "student" | "creator" | "gaming" | "business",
  availability: "" as "" | "in_stock" | "low_stock" | "out_of_stock" | "supplier",
  minScreenInches: 11,
  maxWeightKg: 3.5,
  minBatteryHours: 0,
  maxPrice: 12000,
  minRamGb: 8 as 8 | 16 | 32,
  refreshHz: 0 as 0 | 60 | 120 | 144,
  sort: "price_asc" as "price_asc" | "price_desc",
};

const inputClassName =
  "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none motion-safe:transition-all motion-safe:duration-200 focus:border-blue-500 focus:bg-blue-50/40 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]";

export default function FiltersBar() {
  const { filters, setFilters, fetch, isLoading, savedSearches, saveSearch, removeSavedSearch } = useProductsStore();
  const { t } = useLanguageContext();
  const { notify } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  function syncCategoryInUrl(category: Category | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (!category) {
      params.delete("category");
    } else {
      const urlCategory = category === "school" ? "student" : category;
      params.set("category", urlCategory);
    }

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  return (
    <section id="filters-panel" aria-labelledby="filter-sort-title" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2 lg:mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{t("filters.kicker")}</p>
          <h2 id="filter-sort-title" className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            {t("filters.title")}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 motion-safe:transition-all motion-safe:duration-200 hover:bg-blue-50 lg:hidden"
        >
          {isOpen ? t("filters.close") : t("filters.mobileToggle")}
        </button>
      </div>

      <div className={`${isOpen ? "fixed inset-0 z-50 bg-slate-900/20 lg:static lg:bg-transparent" : "hidden lg:block"}`}>
        <div
          className={`${
            isOpen
              ? "absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto bg-white p-4 shadow-xl"
              : ""
          } lg:static lg:h-auto lg:w-auto lg:max-w-none lg:overflow-visible lg:bg-transparent lg:p-0 lg:shadow-none`}
        >
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold text-slate-900">{t("filters.title")}</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 motion-safe:transition-all motion-safe:duration-200 hover:bg-blue-50"
            >
              {t("filters.close")}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.search")}</label>
              <input
                value={filters.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                placeholder={t("filters.searchPlaceholder")}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">📂 {t("filters.category")}</label>
              <select
                value={filters.category}
                onChange={(e) => {
                  const nextCategory = e.target.value as Category | "";
                  setFilters({ category: nextCategory });
                  syncCategoryInUrl(nextCategory);
                  void fetch();
                }}
                className={inputClassName}
              >
                {categories.map((c) => (
                  <option key={c.value || "all"} value={c.value}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.brand")}</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters({ brand: e.target.value })}
                className={inputClassName}
              >
                <option value="">{t("filters.brand.all")}</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.cpuBrand")}</label>
              <select value={filters.cpuBrand} onChange={(e) => setFilters({ cpuBrand: e.target.value as "" | "intel" | "amd" | "apple" })} className={inputClassName}>
                <option value="">{t("filters.any")}</option>
                <option value="intel">{t("filters.cpuBrand.intel")}</option>
                <option value="amd">{t("filters.cpuBrand.amd")}</option>
                <option value="apple">{t("filters.cpuBrand.apple")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.gpu")}</label>
              <select value={filters.gpu} onChange={(e) => setFilters({ gpu: e.target.value as "" | "integrated" | "nvidia" | "amd" })} className={inputClassName}>
                <option value="">{t("filters.any")}</option>
                <option value="integrated">{t("filters.gpu.integrated")}</option>
                <option value="nvidia">{t("filters.gpu.nvidia")}</option>
                <option value="amd">{t("filters.gpu.amd")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.usageType")}</label>
              <select value={filters.usageType} onChange={(e) => setFilters({ usageType: e.target.value as "" | "student" | "creator" | "gaming" | "business" })} className={inputClassName}>
                <option value="">{t("filters.any")}</option>
                <option value="student">{t("filters.usageType.student")}</option>
                <option value="creator">{t("filters.usageType.creator")}</option>
                <option value="gaming">{t("filters.usageType.gaming")}</option>
                <option value="business">{t("filters.usageType.business")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.availability")}</label>
              <select value={filters.availability} onChange={(e) => setFilters({ availability: e.target.value as "" | "in_stock" | "low_stock" | "out_of_stock" | "supplier" })} className={inputClassName}>
                <option value="">{t("filters.any")}</option>
                <option value="in_stock">{t("filters.availability.in_stock")}</option>
                <option value="low_stock">{t("filters.availability.low_stock")}</option>
                <option value="supplier">{t("filters.availability.supplier")}</option>
                <option value="out_of_stock">{t("filters.availability.out_of_stock")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.maxPrice")}</label>
              <input
                type="number"
                min={2500}
                max={12000}
                value={filters.maxPrice}
                onChange={(e) => setFilters({ maxPrice: clamp(Number(e.target.value || 0), 2500, 12000) })}
                className={inputClassName}
              />
              <input
                type="range"
                min={2500}
                max={12000}
                step={100}
                value={filters.maxPrice}
                onChange={(e) => setFilters({ maxPrice: Number(e.target.value) })}
                className="mt-2 w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.minScreen")}</label>
                <input type="number" step="0.1" value={filters.minScreenInches} onChange={(e) => setFilters({ minScreenInches: clamp(Number(e.target.value || 0), 11, 18) })} className={inputClassName} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.maxWeight")}</label>
                <input type="number" step="0.1" value={filters.maxWeightKg} onChange={(e) => setFilters({ maxWeightKg: clamp(Number(e.target.value || 0), 1, 4) })} className={inputClassName} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.minBattery")}</label>
              <input type="number" step="1" value={filters.minBatteryHours} onChange={(e) => setFilters({ minBatteryHours: clamp(Number(e.target.value || 0), 0, 20) })} className={inputClassName} />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">💾 {t("filters.minRam")}</label>
              <select
                value={filters.minRamGb}
                onChange={(e) => setFilters({ minRamGb: Number(e.target.value) as 8 | 16 | 32 })}
                className={inputClassName}
              >
                <option value={8}>{t("filters.ramOption8")}</option>
                <option value={16}>{t("filters.ramOption16")}</option>
                <option value={32}>{t("filters.ramOption32")}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">⚡ {t("filters.refreshRate")}</label>
              <select
                value={filters.refreshHz}
                onChange={(e) => setFilters({ refreshHz: Number(e.target.value) as 0 | 60 | 120 | 144 })}
                className={inputClassName}
              >
                <option value={0}>{t("filters.any")}</option>
                <option value={60}>{t("filters.refreshOption60")}</option>
                <option value={120}>{t("filters.refreshOption120")}</option>
                <option value={144}>{t("filters.refreshOption144")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (filters.q.trim()) {
                    saveSearch(filters.q.trim());
                    notify({
                      tone: "success",
                      title: t("filters.toast.searchSaved"),
                      description: filters.q.trim(),
                    });
                  }
                  void fetch();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white motion-safe:transition-all motion-safe:duration-200 hover:bg-blue-700 disabled:opacity-60"
              >
                {isLoading ? t("filters.loading") : t("filters.apply")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters(defaultFilters);
                  syncCategoryInUrl("");
                  void fetch();
                  setIsOpen(false);
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 motion-safe:transition-all motion-safe:duration-200 hover:bg-blue-50"
              >
                {t("filters.reset")}
              </button>
            </div>

            {savedSearches.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("filters.savedSearches")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {savedSearches.map((item) => (
                    <div key={item} className="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ q: item });
                          void fetch();
                          notify({
                            tone: "info",
                            title: t("filters.toast.searchApplied"),
                            description: item,
                          });
                        }}
                        className="px-3 py-1 transition hover:bg-blue-50"
                      >
                        {item}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const accepted = await confirm({
                            title: t("filters.removeSavedSearchTitle"),
                            description: t("filters.removeSavedSearchDescription", { item }),
                            confirmLabel: t("filters.removeSavedSearchConfirm"),
                            cancelLabel: t("filters.removeSavedSearchCancel"),
                            tone: "danger",
                          });
                          if (!accepted) return;
                          removeSavedSearch(item);
                          notify({
                            tone: "info",
                            title: t("filters.toast.searchRemoved"),
                            description: item,
                          });
                        }}
                        className="border-l border-slate-200 px-2 py-1 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label={t("filters.removeSavedSearchAria", { item })}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-xs text-slate-600">{t("filters.helper")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
