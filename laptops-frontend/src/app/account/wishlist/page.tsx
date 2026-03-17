"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppState from "@/components/AppState";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { useLanguageContext } from "@/context/languageContext";
import { listProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { hasUserSession } from "@/lib/userAuth";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function AccountWishlistPage() {
  const { t } = useLanguageContext();
  const { ids, hydrate } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(hasUserSession());
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    hydrate();
  }, [hydrate, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let alive = true;
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listProducts();
        if (!alive) return;
        setProducts(data);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : t("accountWishlist.loadError"));
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthenticated, t]);

  const items = useMemo(() => products.filter((product) => ids.includes(product.id)), [products, ids]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 section-title text-slate-900">{t("accountWishlist.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("accountWishlist.subtitle")}</p>

        {!isAuthenticated ? (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Your wishlist is saved locally</h2>
            <p className="mt-2 text-sm text-slate-600">Log in to sync it across devices and keep your saved products everywhere.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Create account
              </Link>
            </div>
          </div>
        ) : null}

        {isAuthenticated && isLoading ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProductCardSkeleton key={`account_wishlist_skeleton_${index}`} />
            ))}
          </div>
        ) : null}

        {isAuthenticated && !isLoading && error ? (
          <AppState
            tone="error"
            title={t("accountWishlist.loadError")}
            description={error}
            actionLabel={t("orderSuccess.continueShopping")}
            actionHref="/"
            className="mt-7"
          />
        ) : null}

        {isAuthenticated && !isLoading && !error && items.length === 0 ? (
          <AppState
            tone="empty"
            title={t("accountWishlist.emptyTitle")}
            description={t("accountWishlist.emptyDescription")}
            actionLabel={t("orderSuccess.continueShopping")}
            actionHref="/"
            className="mt-7"
          />
        ) : (
          isAuthenticated && !isLoading && !error ? (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null
        )}

        <Link href="/account" className="mt-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-600">
          ← {t("accountWishlist.backToAccount")}
        </Link>
      </section>
    </div>
  );
}
