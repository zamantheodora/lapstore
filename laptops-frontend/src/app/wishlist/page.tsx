"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AppState from "@/components/AppState";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { listProducts } from "@/lib/api";
import { hasUserSession } from "@/lib/userAuth";
import type { Product } from "@/lib/types";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function WishlistPage() {
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
        setError(e instanceof Error ? e.message : "Could not load wishlist");
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  const items = useMemo(() => products.filter((product) => ids.includes(product.id)), [products, ids]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Favorites</p>
        <h1 className="mt-2 section-title text-slate-900">Your Wishlist</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Save premium laptop picks and revisit them anytime.</p>

        {!isAuthenticated ? (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Please log in to use your wishlist</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to add, view, and manage wishlist items.</p>
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
              <ProductCardSkeleton key={`wishlist_skeleton_${index}`} />
            ))}
          </div>
        ) : null}

        {isAuthenticated && !isLoading && error ? (
          <AppState
            tone="error"
            title="Could not load wishlist"
            description={error}
            actionLabel="Back to catalog"
            actionHref="/"
            className="mt-7"
          />
        ) : null}

        {isAuthenticated && !isLoading && !error && items.length === 0 ? (
          <AppState
            tone="empty"
            title="Your wishlist is empty"
            description="Save premium laptop picks and revisit them anytime."
            actionLabel="Browse laptops"
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
      </section>
    </div>
  );
}
