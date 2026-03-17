"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import RevealOnScroll from "@/components/RevealOnScroll";
import { useLanguageContext } from "@/context/languageContext";
import type { TranslationKey } from "@/i18n/en";
import FiltersBar from "@/components/FiltersBar";
import ProductCard from "@/components/ProductCard";
import { loadAdminProductsFromStorage, loadDeletedProductIdsFromStorage } from "@/lib/adminProducts";
import { listProducts } from "@/lib/api";
import { getProductScores } from "@/lib/productInsights";
import { formatPriceRon } from "@/lib/utils";
import { useCompareStore } from "@/store/useCompareStore";
import { useProductsStore } from "@/store/useProductsStore";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import type { Product } from "@/lib/types";

const topCategories: Array<{ titleKey: TranslationKey; subtitleKey: TranslationKey; href: string; icon: ReactElement }> = [
  {
    titleKey: "home.topCategory.student.title",
    subtitleKey: "home.topCategory.student.subtitle",
    href: "/laptops?category=student",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 7l8 4 8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    titleKey: "home.topCategory.gaming.title",
    subtitleKey: "home.topCategory.gaming.subtitle",
    href: "/laptops?category=gaming",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <path d="M5 8h14l-1.2 7.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 12h3M10.5 10.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    titleKey: "home.topCategory.work.title",
    subtitleKey: "home.topCategory.work.subtitle",
    href: "/laptops?category=work",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <rect x="4" y="5" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    titleKey: "home.topCategory.ultrabook.title",
    subtitleKey: "home.topCategory.ultrabook.subtitle",
    href: "/laptops?category=ultrabook",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
        <rect x="5" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

type DiscoveryTab = "trending" | "value" | "persona";

function DiscoveryMiniCard({
  item,
  fallbackNote,
}: {
  item?: Product;
  fallbackNote?: string;
}) {
  const { t } = useLanguageContext();

  if (!item) {
    return (
      <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
        <p className="text-sm font-semibold text-slate-700">{t("home.discovery.noMatch")}</p>
        <p className="mt-1 text-xs text-slate-500">{fallbackNote ?? t("home.discovery.adjustFilters")}</p>
      </article>
    );
  }

  const imageSrc = item.images?.[0] || item.cover_photo || "/laptop-placeholder.svg";
  const rating = (4.2 + (item.id % 7) * 0.1).toFixed(1);
  const reviewCount = 70 + (item.id * 23) % 260;
  const filledStars = Math.round(Number(rating));

  return (
    <Link
      href={`/products/${item.id}`}
      className="group hover-lift overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_30px_50px_-28px_rgba(37,99,235,0.32)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 bg-white p-1.5">
        <Image src={imageSrc} alt={item.title} fill unoptimized className="object-contain object-center p-0 transition duration-300 group-hover:scale-[1.06]" />
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{item.title}</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-0.5 text-[12px] leading-none text-amber-500" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={`star_${item.id}_${index}`} className={index < filledStars ? "text-amber-500" : "text-slate-300"}>★</span>
            ))}
          </span>
          <span className="font-medium text-slate-600">{rating}</span>
          <span>({reviewCount})</span>
        </div>
        <p className="text-xs text-slate-500">{item.brand} · {item.ram_gb}GB RAM · {item.storage_gb}GB SSD</p>
        <p className="text-base font-bold tracking-tight text-blue-800">{formatPriceRon(item.price)}</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { products, filters, setFilters, isLoading, error, fetch } = useProductsStore();
  const { hydrate: hydrateCompare } = useCompareStore();
  const { hydrate: hydrateViewed } = useRecentlyViewedStore();
  const { t } = useLanguageContext();
  const searchParams = useSearchParams();
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<DiscoveryTab>("trending");
  const [showAllCatalog, setShowAllCatalog] = useState(false);
  const [discoveryProducts, setDiscoveryProducts] = useState<Product[]>([]);

  useEffect(() => {
    hydrateCompare();
    hydrateViewed();
  }, [hydrateCompare, hydrateViewed]);

  useEffect(() => {
    let alive = true;

    const loadDiscoveryProducts = async () => {
      try {
        const apiProducts = await listProducts();
        const localAdminProducts = loadAdminProductsFromStorage();
        const deletedIds = new Set(loadDeletedProductIdsFromStorage());
        const mergedById = new Map<number, Product>();

        apiProducts.forEach((product) => {
          if (!deletedIds.has(product.id)) mergedById.set(product.id, product);
        });
        localAdminProducts.forEach((product) => {
          if (!deletedIds.has(product.id)) mergedById.set(product.id, product);
        });

        if (alive) {
          setDiscoveryProducts(Array.from(mergedById.values()));
        }
      } catch {
        if (alive) {
          setDiscoveryProducts([]);
        }
      }
    };

    void loadDiscoveryProducts();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const mappedCategory = categoryParam === "student" ? "school" : categoryParam === "work" ? "ultrabook" : categoryParam;
    const validCategory = mappedCategory === "gaming" || mappedCategory === "school" || mappedCategory === "ultrabook" ? mappedCategory : "";

    setFilters({ category: validCategory });

    void fetch();

    if (categoryParam) {
      window.requestAnimationFrame(() => {
        document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams, setFilters, fetch]);

  const uniqueById = (items: Product[]) => {
    const seen = new Set<number>();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const trending = useMemo(
    () => uniqueById([...discoveryProducts].sort((a, b) => getProductScores(b).performance - getProductScores(a).performance)).slice(0, 4),
    [discoveryProducts]
  );

  const valuePicks = useMemo(
    () => uniqueById([...discoveryProducts].sort((a, b) => getProductScores(b).value - getProductScores(a).value)).slice(0, 4),
    [discoveryProducts]
  );

  const bestByPersona = useMemo(() => {
    const used = new Set<number>();
    const pick = (predicate: (product: Product) => boolean) => {
      const found = discoveryProducts.find((product) => !used.has(product.id) && predicate(product));
      if (!found) return undefined;
      used.add(found.id);
      return found;
    };

    return [
      { key: "students", item: pick((p) => p.category === "school") },
      { key: "creators", item: pick((p) => p.ram_gb >= 16 && p.storage_gb >= 512) },
      { key: "gamers", item: pick((p) => p.category === "gaming") },
      { key: "business", item: pick((p) => p.category === "ultrabook") },
    ];
  }, [discoveryProducts]);

  const discoveryItems: Product[] = activeDiscoveryTab === "trending" ? trending : activeDiscoveryTab === "value" ? valuePicks : [];

  const discoveryTitle =
    activeDiscoveryTab === "trending"
      ? t("home.smartDiscoveryTitle.trending")
      : activeDiscoveryTab === "value"
        ? t("home.smartDiscoveryTitle.value")
        : t("home.smartDiscoveryTitle.persona");

  const visibleProducts = showAllCatalog ? products : products.slice(0, 9);
  const heroTitle = t("home.heroTitle");
  const heroTitleParts = heroTitle.split("AI");

  return (
    <div className="animate-page-in">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <RevealOnScroll>
          <section className="relative overflow-hidden rounded-[1.8rem] border border-blue-100/70 bg-gradient-to-br from-[#071126] via-[#0a2452] to-[#0b5fff] p-5 text-white shadow-[0_28px_80px_-35px_rgba(8,20,43,0.7)] sm:p-7 lg:p-8">
            <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/90">{t("home.heroBrandKicker")}</p>
                <h1 className="hero-headline-in mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {heroTitleParts.length > 1
                    ? heroTitleParts.map((part, index) => (
                        <span key={`hero_title_part_${index}`}>
                          {part}
                          {index < heroTitleParts.length - 1 ? (
                            <span className="bg-gradient-to-r from-blue-200 via-cyan-200 to-violet-200 bg-clip-text text-transparent">AI</span>
                          ) : null}
                        </span>
                      ))
                    : heroTitle}
                </h1>
                <p className="hero-headline-in mt-3 max-w-2xl text-sm text-blue-100/90 sm:text-base">{t("home.heroSubtitle")}</p>
                <div className="hero-cta-in mt-6 flex flex-wrap gap-2.5">
                  <Link
                    href="#catalog"
                    className="button-glow inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0b2f6d] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105"
                  >
                    {t("home.heroBrowseLaptops")}
                  </Link>
                  <Link
                    href="/wizard"
                    className="button-glow inline-flex items-center rounded-xl border border-white/45 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    {t("home.heroStartFinder")}
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-blue-100">
                  <span className="soft-glow-ring rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">{t("home.heroTrustCompared")}</span>
                  <span className="soft-glow-ring rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur">{t("home.heroTrustAi")}</span>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-lg lg:-mr-2">
                <div className="hero-radial-glow pointer-events-none absolute inset-x-12 top-2 h-44 rounded-full blur-2xl" />
                <div className="pointer-events-none absolute inset-x-10 top-4 h-36 rounded-full bg-gradient-to-r from-cyan-300/18 via-blue-300/16 to-cyan-300/18 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-16 bottom-3 h-8 rounded-[999px] bg-slate-950/30 blur-xl" />
                <div className="relative flex min-h-[250px] items-center justify-center sm:min-h-[280px]">
                  <Image
                    src="/images/products/asus-zenbook-14-oled-ux3405-hero.png"
                    alt="Premium laptop"
                    width={900}
                    height={620}
                    className="hero-float h-auto w-[62%] min-w-[260px] max-w-[440px] object-contain drop-shadow-[0_20px_26px_rgba(15,23,42,0.28)] motion-safe:transition motion-safe:duration-500 motion-safe:ease-out"
                    priority
                  />
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -left-12 -top-10 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-52 w-52 rounded-full bg-blue-300/20 blur-3xl" />
          </section>
        </RevealOnScroll>

        <RevealOnScroll className="mt-5" delayMs={80}>
          <section className="premium-panel rounded-3xl p-4.5 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title text-slate-900">{t("home.topCategoriesTitle")}</h2>
            </div>
            <div className="stagger-reveal mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {topCategories.map((category) => (
                <Link
                  key={category.titleKey}
                  href={category.href}
                  className="hover-lift premium-soft-panel cursor-pointer rounded-2xl p-4 shadow-[0_16px_26px_-24px_rgba(15,23,42,0.25)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_48px_-26px_rgba(37,99,235,0.34)]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-700 ring-1 ring-blue-200/70">
                    {category.icon}
                  </span>
                  <h3 className="mt-2.5 text-base font-semibold text-slate-900">{t(category.titleKey)}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{t(category.subtitleKey)}</p>
                </Link>
              ))}
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll className="mt-5" delayMs={110}>
          <section className="premium-panel rounded-3xl border border-slate-200/90 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("home.smartDiscoveryKicker")}</p>
                <h2 className="section-title mt-1 text-slate-900">{discoveryTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">{t("home.smartDiscoverySubtitle")}</p>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 p-1">
                {[
                  { id: "trending", label: t("home.discovery.trending") },
                  { id: "value", label: t("home.discovery.value") },
                  { id: "persona", label: t("home.discovery.persona") },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDiscoveryTab(tab.id as DiscoveryTab)}
                    aria-pressed={activeDiscoveryTab === tab.id}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ease-out sm:px-3.5 ${
                      activeDiscoveryTab === tab.id
                        ? "soft-glow-ring bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_8px_22px_-14px_rgba(29,78,216,0.7)] ring-1 ring-blue-700/35"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeDiscoveryTab === "persona" ? (
              <div className="stagger-reveal mt-3.5 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {bestByPersona.map((entry) => (
                  <DiscoveryMiniCard
                    key={entry.key}
                    item={entry.item ?? undefined}
                    fallbackNote={t("home.discovery.adjustFilters")}
                  />
                ))}
              </div>
            ) : (
              <div className="stagger-reveal mt-3.5 grid grid-cols-1 gap-6 transition-all duration-300 sm:grid-cols-2 xl:grid-cols-4">
                {discoveryItems.map((item) => (
                  <DiscoveryMiniCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        </RevealOnScroll>

        <RevealOnScroll className="mt-5" delayMs={130}>
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-[#07152f] via-[#0d2d66] to-[#1e3a8a] p-4.5 text-white shadow-[0_24px_60px_-34px_rgba(8,20,43,0.75)] sm:p-5.5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/90">{t("home.howItWorksTitle")}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t("home.howItWorksHeading")}</h2>
                <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
                  {t("home.howItWorksDescription")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/90">{t("home.howItWorksCompareTitle")}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-blue-50">
                  <li>• {t("home.howItWorksCompareItem1")}</li>
                  <li>• {t("home.howItWorksCompareItem2")}</li>
                  <li>• {t("home.howItWorksCompareItem3")}</li>
                </ul>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-2.5 text-xs font-semibold text-blue-100 sm:grid-cols-3">
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">{t("home.howItWorksStep1")}</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">{t("home.howItWorksStep2")}</div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">{t("home.howItWorksStep3")}</div>
            </div>
          </section>
        </RevealOnScroll>

        <RevealOnScroll className="mt-5" delayMs={150}>
          <section id="catalog" className="premium-panel rounded-3xl p-4.5 sm:p-5.5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("catalog.kicker")}
              </p>
              <h2 className="section-title mt-1 text-slate-900 sm:text-2xl">
                {t("catalog.title")}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">{t("catalog.productsFound", { count: products.length })}</p>
              <label className="sr-only" htmlFor="catalog-sort">
                {t("catalog.sortLabel")}
              </label>
              <select
                id="catalog-sort"
                value={filters.sort}
                onChange={(e) => {
                  setFilters({ sort: e.target.value as "price_asc" | "price_desc" });
                  void fetch();
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-blue-50/40"
              >
                <option value="price_asc">{t("catalog.sortPriceAsc")}</option>
                <option value="price_desc">{t("catalog.sortPriceDesc")}</option>
              </select>
            </div>
          </div>

          <div id="product-grid" className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[272px_minmax(0,1fr)]">
            <aside>
              <FiltersBar />
            </aside>

            <div>
              {isLoading ? (
                <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <ProductCardSkeleton key={`catalog_skeleton_${index}`} />
                  ))}
                </div>
              ) : null}

              {!isLoading && error ? (
                <div className="mt-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {t("catalog.loadError", { error })}
                </div>
              ) : null}

              {!isLoading && !error && products.length === 0 ? (
                <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  {t("catalog.noMatchHint")}
                </div>
              ) : null}

              {!isLoading && !error && products.length > 0 ? (
                <>
                <div className="stagger-reveal mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {products.length > 9 ? (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllCatalog((current) => !current)}
                      className="button-glow rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100"
                    >
                      {showAllCatalog ? t("catalog.showCompact") : t("catalog.showAll", { count: products.length })}
                    </button>
                  </div>
                ) : null}
                </>
              ) : null}
            </div>
          </div>
          </section>
        </RevealOnScroll>
      </div>

    </div>
  );
}
