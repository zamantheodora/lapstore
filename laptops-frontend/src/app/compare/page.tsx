"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import AppState from "@/components/AppState";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { useConfirm } from "@/context/confirmContext";
import { useToast } from "@/context/toastContext";
import { listProducts } from "@/lib/api";
import { getProductScores } from "@/lib/productInsights";
import type { Product } from "@/lib/types";
import { formatPriceRon } from "@/lib/utils";
import { useCompareStore } from "@/store/useCompareStore";

type NumericSpec = {
  key: "ram_gb" | "storage_gb" | "screen_inches" | "refresh_hz" | "battery_hours" | "weight_kg" | "price";
  label: string;
  better: "higher" | "lower";
  format: (product: Product) => string;
};

type TextSpec = {
  key: "cpu" | "gpu" | "resolution" | "os";
  label: string;
  format?: (product: Product) => string;
};

type SpecGroup = {
  title: string;
  numeric: NumericSpec[];
  text?: TextSpec[];
};

const specGroups: SpecGroup[] = [
  {
    title: "Core Hardware",
    numeric: [
      { key: "ram_gb", label: "RAM", better: "higher", format: (product) => `${product.ram_gb} GB` },
      { key: "storage_gb", label: "Storage", better: "higher", format: (product) => `${product.storage_gb} GB` },
    ],
    text: [
      { key: "cpu", label: "CPU" },
      { key: "gpu", label: "GPU" },
    ],
  },
  {
    title: "Display",
    numeric: [
      { key: "screen_inches", label: "Screen size", better: "higher", format: (product) => `${product.screen_inches}\"` },
      {
        key: "refresh_hz",
        label: "Refresh rate",
        better: "higher",
        format: (product) => `${product.refresh_hz ?? 60} Hz`,
      },
    ],
    text: [{ key: "resolution", label: "Resolution" }],
  },
  {
    title: "Mobility & Value",
    numeric: [
      { key: "battery_hours", label: "Battery", better: "higher", format: (product) => `${product.battery_hours} h` },
      { key: "weight_kg", label: "Weight", better: "lower", format: (product) => `${product.weight_kg} kg` },
      { key: "price", label: "Price", better: "lower", format: (product) => formatPriceRon(product.price) },
    ],
    text: [{ key: "os", label: "OS" }],
  },
];

function winnerForNumericSpec(compared: Product[], spec: NumericSpec): number | null {
  if (compared.length === 0) return null;
  if (spec.better === "higher") {
    const bestValue = Math.max(...compared.map((product) => product[spec.key] as number));
    return compared.find((product) => (product[spec.key] as number) === bestValue)?.id ?? null;
  }
  const bestValue = Math.min(...compared.map((product) => product[spec.key] as number));
  return compared.find((product) => (product[spec.key] as number) === bestValue)?.id ?? null;
}

function ScoreBar({ value, highlight = false }: { value: number; highlight?: boolean }) {
  return (
    <div>
      <div className={`mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide ${highlight ? "text-blue-700" : "text-slate-500"}`}>
        <span>{value}</span>
        <span>/100</span>
      </div>
      <div className={`rounded-full ${highlight ? "h-2 bg-blue-100" : "h-1.5 bg-slate-200"}`}>
        <div className={`rounded-full ${highlight ? "h-2 bg-blue-700" : "h-1.5 bg-blue-600"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { ids, hydrate, clear, toggle } = useCompareStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirm } = useConfirm();
  const { notify } = useToast();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
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
        setError(e instanceof Error ? e.message : "Could not load comparison catalog");
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const compared = useMemo(() => products.filter((product) => ids.includes(product.id)).slice(0, 3), [products, ids]);
  const scoresById = useMemo(() => {
    const map = new Map<number, ReturnType<typeof getProductScores>>();
    compared.forEach((product) => map.set(product.id, getProductScores(product)));
    return map;
  }, [compared]);

  const scoreWinners = useMemo(() => {
    if (compared.length === 0) {
      return {
        performance: null,
        battery: null,
        portability: null,
        value: null,
      };
    }

    const ranked = compared.map((product) => ({ product, score: getProductScores(product) }));
    return {
      performance: ranked.sort((a, b) => b.score.performance - a.score.performance)[0]?.product.id ?? null,
      battery: ranked.sort((a, b) => b.score.battery - a.score.battery)[0]?.product.id ?? null,
      portability: ranked.sort((a, b) => b.score.portability - a.score.portability)[0]?.product.id ?? null,
      value: ranked.sort((a, b) => b.score.value - a.score.value)[0]?.product.id ?? null,
    };
  }, [compared]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Compare</p>
            <h1 className="mt-2 section-title text-slate-900">Laptop Comparison</h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              if (ids.length === 0) return;
              const accepted = await confirm({
                title: "Clear comparison list?",
                description: "This will remove all selected laptops from comparison.",
                confirmLabel: "Clear",
                cancelLabel: "Cancel",
                tone: "danger",
              });
              if (!accepted) return;
              clear();
              notify({
                tone: "info",
                title: "Comparison cleared",
              });
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
          >
            Clear comparison
          </button>
        </div>

        {isLoading ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProductCardSkeleton key={`compare_skeleton_${index}`} />
            ))}
          </div>
        ) : null}

        {!isLoading && error ? (
          <AppState
            tone="error"
            title="Could not load comparison data"
            description={error}
            actionLabel="Back to catalog"
            actionHref="/"
            className="mt-7"
          />
        ) : null}

        {!isLoading && !error && compared.length === 0 ? (
          <AppState
            tone="empty"
            title="No laptops selected yet"
            description="Select up to 3 laptops from product cards to compare specifications side by side."
            actionLabel="Go to catalog"
            actionHref="/"
            className="mt-7"
          />
        ) : null}

        {!isLoading && !error && compared.length > 0 ? (
          <>
            <div className={`mx-auto mt-7 grid gap-6 ${compared.length > 1 ? "w-full max-w-[560px] grid-cols-1 sm:grid-cols-2" : "w-full max-w-[260px] grid-cols-1"}`}>
              {compared.map((product) => (
                <article key={`sticky_${product.id}`} className="relative h-[214px] rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      toggle(product.id);
                      notify({
                        tone: "info",
                        title: "Removed from comparison",
                        description: product.title,
                      });
                    }}
                    className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                    aria-label={`Remove ${product.title}`}
                  >
                    ×
                  </button>
                  <div className="mx-auto flex h-[112px] w-[172px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                    <Image
                      src={product.images?.[0] || product.cover_photo || "/laptop-placeholder.svg"}
                      alt={product.title}
                      width={240}
                      height={120}
                      unoptimized
                      className="max-h-[100px] max-w-[160px] h-auto w-auto object-contain object-center"
                    />
                  </div>
                  <p className="mt-3 line-clamp-2 h-10 text-sm font-semibold leading-5 text-slate-900">{product.title}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 overflow-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_24px_46px_-40px_rgba(15,23,42,0.58)]">
              <table className="min-w-[980px] w-full border-collapse text-left">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50/90 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Spec</th>
                    {compared.map((product) => (
                      <th key={product.id} className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {product.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold text-slate-700">Finder scores</td>
                    {compared.map((product) => {
                      const score = scoresById.get(product.id);
                      if (!score) {
                        return <td key={`score_${product.id}`} className="px-4 py-4 text-sm text-slate-600">—</td>;
                      }
                      return (
                        <td key={`score_${product.id}`} className="px-4 py-4">
                          <div className="space-y-3">
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Performance</p>
                              <ScoreBar value={score.performance} highlight={scoreWinners.performance === product.id} />
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Battery</p>
                              <ScoreBar value={score.battery} highlight={scoreWinners.battery === product.id} />
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Portability</p>
                              <ScoreBar value={score.portability} highlight={scoreWinners.portability === product.id} />
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Value</p>
                              <ScoreBar value={score.value} highlight={scoreWinners.value === product.id} />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>

                {specGroups.map((group) => (
                  <tbody key={group.title}>
                    <tr className="border-t border-slate-200 bg-slate-50/70">
                      <td colSpan={compared.length + 1} className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {group.title}
                      </td>
                    </tr>

                    {group.text?.map((spec) => (
                      <tr key={spec.key} className="border-t border-slate-100/90">
                        <td className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold text-slate-600">{spec.label}</td>
                        {compared.map((product) => (
                          <td key={`${product.id}_${spec.key}`} className="px-4 py-4 text-sm text-slate-800">
                            {spec.format ? spec.format(product) : String(product[spec.key])}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {group.numeric.map((spec) => {
                      const winnerId = winnerForNumericSpec(compared, spec);
                      return (
                        <tr key={spec.key} className="border-t border-slate-100/90">
                          <td className="sticky left-0 bg-white px-4 py-4 text-sm font-semibold text-slate-600">{spec.label}</td>
                          {compared.map((product) => (
                            <td
                              key={`${product.id}_${spec.key}`}
                              className={`px-4 py-4 text-sm ${winnerId === product.id ? "font-semibold text-blue-700" : "text-slate-800"}`}
                            >
                              <span className={winnerId === product.id ? "rounded-md bg-blue-50 px-2 py-1.5 ring-1 ring-blue-200" : ""}>{spec.format(product)}</span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
