"use client";

import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "@/components/AddToCartButton";
import ProductCompareToggle from "@/components/ProductCompareToggle";
import ProductWishlistToggle from "@/components/ProductWishlistToggle";
import { useLanguageContext } from "@/context/languageContext";
import { monthlyPayment } from "@/lib/productInsights";
import type { Product } from "@/lib/types";
import { formatPriceRon } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguageContext();
  const primaryImage = product.images?.[0] || product.cover_photo || "/laptop-placeholder.svg";
  const rating = (4.3 + (product.id % 5) * 0.1).toFixed(1);
  const reviewCount = 60 + (product.id * 19) % 240;
  const stockLabel = product.price > 8500 ? t("productCard.lowStock") : t("productCard.inStock");

  const badges: string[] = [];
  if (product.id === 1) badges.push(t("productCard.badge.bestSeller"));
  if (product.id === 2) badges.push(t("productCard.badge.trending"));
  if (product.id === 3) badges.push(t("productCard.badge.discount"));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/96 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.34)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_30px_56px_-30px_rgba(37,99,235,0.34)]">
      {badges.length > 0 ? (
        <div className="px-4.5 pt-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
              <span key={badge} className="soft-glow-ring inline-flex rounded-full bg-gradient-to-r from-slate-900/94 to-slate-800/92 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-white shadow-sm">
                {badge}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <Link href={`/products/${product.id}`} className={`block px-4.5 ${badges.length > 0 ? "pt-1.5" : "pt-3.5"}`}>
        <div className="relative h-[208px] w-full overflow-hidden rounded-xl border border-slate-100 bg-white p-4 transition-all duration-300 group-hover:border-blue-100">
          <div className="absolute right-3 top-3 z-20">
            <ProductWishlistToggle productId={product.id} productTitle={product.title} compact />
          </div>
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            unoptimized
            className="object-contain object-center p-4 transition duration-500 ease-out group-hover:scale-[1.08]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="flex h-full flex-col px-4.5 pb-4.5 pt-2.5">
        <div>
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-2 min-h-[3.4rem] text-[17px] font-semibold leading-snug text-slate-900 transition-colors duration-300 hover:text-slate-700"
          >
            {product.title}
          </Link>

          <p className="mt-1.5 text-[13px] font-medium text-slate-600">⭐ {rating} ({reviewCount} reviews)</p>

          <p className="mt-2 line-clamp-1 min-h-[1.25rem] text-[13px] font-medium text-slate-600">
            {product.cpu.split(" ").slice(0, 2).join(" ")} • {t("productCard.ram", { value: product.ram_gb })} • {t("productCard.ssd", { value: product.storage_gb })}
          </p>

          <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stockLabel === t("productCard.lowStock") ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}>
            {stockLabel}
          </p>
        </div>

        <div className="mt-auto pt-4">
          <div>
            <p className="text-[22px] font-semibold tracking-tight text-slate-900">{formatPriceRon(product.price)}</p>
            <p className="mt-1 text-[13px] font-medium text-slate-500">{t("productCard.financing", { amount: formatPriceRon(monthlyPayment(product)) })}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <AddToCartButton product={product} compact />
            <ProductCompareToggle productId={product.id} productTitle={product.title} compact />
          </div>
        </div>
      </div>
    </article>
  );
}
