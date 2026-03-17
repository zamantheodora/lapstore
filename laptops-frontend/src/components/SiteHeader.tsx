"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useCartContext } from "@/context/cartContext";
import { useLanguageContext } from "@/context/languageContext";
import { listProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { clearUserSession, hasUserSession } from "@/lib/userAuth";
import { useCompareStore } from "@/store/useCompareStore";
import { useWishlistStore } from "@/store/useWishlistStore";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19" r="1.5" fill="currentColor" />
      <circle cx="18" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CompareNavIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4.5 w-4.5">
      <path d="M7 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m15 4 4 3-4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m9 14-4 3 4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WishlistNavIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4.5 w-4.5">
      <path
        d="M12 20.5 4.8 13.3a4.7 4.7 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0L12 7.2l.6-.5a4.7 4.7 0 0 1 6.6 6.6L12 20.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FinderNavIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4.5 w-4.5">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-blue-600">
      <rect x="4" y="6" width="16" height="10" rx="1.75" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 18.5h19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const cartContext = useCartContext();
  const { lang, setLang, t } = useLanguageContext();
  const { hydrate: hydrateCompare } = useCompareStore();
  const { hydrate: hydrateWishlist, clear: clearWishlist } = useWishlistStore();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    hydrateCompare();
    hydrateWishlist();
  }, [hydrateCompare, hydrateWishlist]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const products = await listProducts();
        if (!alive) return;
        setCatalog(products);
      } catch {
        // no-op: search suggestions are optional
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setIsAuthenticated(hasUserSession());
  }, [pathname]);

  useEffect(() => {
    const onStorage = () => {
      setIsAuthenticated(hasUserSession());
    };

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const productSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return catalog.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 5);
  }, [catalog, query]);

  const brandSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as string[];

    return Array.from(
      new Set(
        catalog
          .map((item) => item.brand)
          .filter((brand) => brand.toLowerCase().includes(q))
      )
    ).slice(0, 4);
  }, [catalog, query]);

  const hasSuggestions = productSuggestions.length > 0 || brandSuggestions.length > 0;

  return (
    <header className={`site-header glass-surface sticky top-0 z-40 border-b border-slate-200/60 bg-white/68 ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-violet-400/70" />
      <div className="pointer-events-none absolute -top-8 right-10 h-20 w-20 rounded-full bg-blue-300/20 blur-2xl" />
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex shrink-0 items-center gap-3 text-[1.35rem] font-[650] tracking-tight text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.7)]">
            <BrandIcon />
          </span>
          <span className="leading-none">LapStore</span>
        </Link>

        <div className="order-3 w-full sm:order-none sm:flex-1">
          <label htmlFor="site-search" className="sr-only">
            {t("header.searchLabel")}
          </label>
          <div className="relative">
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("header.searchPlaceholder")}
              className="h-11 w-full rounded-xl border border-slate-200/80 bg-white/88 px-4 text-sm font-medium text-slate-900 outline-none motion-safe:transition-all motion-safe:duration-300 placeholder:text-slate-500 focus:border-blue-500 focus:bg-blue-50/40 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.16)]"
            />

            {query.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/98 shadow-[0_26px_56px_-34px_rgba(15,23,42,0.62)] backdrop-blur">
                {brandSuggestions.length > 0 ? (
                  <div className="border-b border-slate-100 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{t("header.search.brands")}</p>
                    <div className="flex flex-wrap gap-2">
                      {brandSuggestions.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setQuery(brand)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {productSuggestions.length > 0 ? (
                  <div className="p-2">
                    <p className="px-1 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{t("header.search.products")}</p>
                    {productSuggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.id}`}
                        onClick={() => setQuery("")}
                        className="block rounded-xl px-2 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50/70"
                      >
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.brand} · {item.cpu}</p>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {!hasSuggestions ? <p className="px-3 py-3 text-sm text-slate-500">{t("header.search.noResults")}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <nav className="hidden items-center gap-4 lg:flex xl:gap-5">
          <Link href="/compare" className="group relative inline-flex items-center gap-2.5 rounded-lg px-4 py-2 text-base font-semibold text-slate-600 transition-all duration-250 hover:bg-blue-50/65 hover:text-slate-900">
            <span className="relative inline-flex shrink-0">
              <span className="icon-shift inline-flex"><CompareNavIcon /></span>
            </span>
            <span>{t("header.nav.compare")}</span>
            <span className="pointer-events-none absolute inset-x-4 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500/70 to-violet-500/70 transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
          <Link href={isAuthenticated ? "/wishlist" : "/login"} className="group relative inline-flex items-center gap-2.5 rounded-lg px-4 py-2 text-base font-semibold text-slate-600 transition-all duration-250 hover:bg-blue-50/65 hover:text-slate-900">
            <span className="relative inline-flex shrink-0">
              <span className="icon-shift inline-flex"><WishlistNavIcon /></span>
            </span>
            <span>{t("header.nav.wishlist")}</span>
            <span className="pointer-events-none absolute inset-x-4 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500/70 to-violet-500/70 transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
          <Link href="/wizard" className="group relative inline-flex items-center gap-2.5 rounded-lg px-4 py-2 text-base font-semibold text-slate-600 transition-all duration-250 hover:bg-blue-50/65 hover:text-slate-900">
            <span className="icon-shift inline-flex"><FinderNavIcon /></span>
            <span>{t("header.nav.laptopFinder")}</span>
            <span className="pointer-events-none absolute inset-x-4 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-blue-500/70 to-violet-500/70 transition-transform duration-200 group-hover:scale-x-100" />
          </Link>
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              onBlur={() => {
                window.setTimeout(() => {
                  setAccountOpen(false);
                }, 120);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/88 px-3.5 text-[15px] font-semibold text-slate-700 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 hover:text-slate-900"
              aria-label={t("header.account")}
              aria-expanded={accountOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="icon-shift h-4.5 w-4.5">
                <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M5.5 19a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">{t("header.account")}</span>
            </button>

            {accountOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-[0_24px_46px_-30px_rgba(15,23,42,0.45)]">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" className="block px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{t("header.account.login")}</Link>
                    <Link href="/register" className="block px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{t("header.account.register")}</Link>
                  </>
                ) : (
                  <>
                    <Link href="/account" className="block px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{t("header.account.profile")}</Link>
                    <Link href="/account/orders" className="block px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{t("header.account.orders")}</Link>
                    <Link href="/account/wishlist" className="block px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{t("header.account.wishlist")}</Link>
                    <button
                      type="button"
                      onClick={() => {
                        clearUserSession();
                        clearWishlist();
                        setIsAuthenticated(false);
                        setAccountOpen(false);
                        router.push("/");
                      }}
                      className="block w-full px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      {t("header.account.logout")}
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/88 p-1 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.7)]">
            <button
              type="button"
              onClick={() => setLang("ro")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                lang === "ro" ? "soft-glow-ring bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              RO
            </button>
            <span className="text-xs text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                lang === "en" ? "soft-glow-ring bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href="/cart"
            className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/92 px-4 py-2 text-[15px] font-semibold text-slate-700 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.8)] motion-safe:transition-all motion-safe:duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50"
          >
            <span className="icon-shift inline-flex"><CartIcon /></span>
            <span>{t("header.cart")}</span>
            <span className="soft-glow-ring absolute -right-2 -top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-1.5 text-xs font-semibold text-white shadow-sm ring-2 ring-white">
              {cartContext.cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
