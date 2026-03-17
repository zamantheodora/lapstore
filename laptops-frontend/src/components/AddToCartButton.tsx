"use client";

import { useCartContext } from "@/context/cartContext";
import { useLanguageContext } from "@/context/languageContext";
import { useToast } from "@/context/toastContext";
import type { Product } from "@/lib/types";

type AddToCartButtonProps = {
  product: Product;
  compact?: boolean;
  variant?: "primary" | "subtle";
};

export default function AddToCartButton({ product, compact = false, variant = "primary" }: AddToCartButtonProps) {
  const cartContext = useCartContext();
  const { t } = useLanguageContext();
  const { notify } = useToast();

  return (
    <div className="flex items-stretch">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          cartContext.addItem(product);
          notify({
            tone: "success",
            title: t("cart.addedToCart"),
            description: product.title,
          });
        }}
        className={
          variant === "subtle"
            ? compact
              ? "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition-all duration-300 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-gray-50"
              : "h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-all duration-300 hover:-translate-y-[1px] hover:border-gray-300 hover:bg-gray-50"
            : compact
              ? "button-glow h-9 w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 text-xs font-semibold text-white shadow-sm shadow-blue-900/20 transition-all duration-300 hover:-translate-y-[1px] hover:from-blue-500 hover:to-cyan-400"
              : "button-glow h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition-all duration-300 hover:-translate-y-[1px] hover:from-blue-500 hover:to-cyan-400"
        }
      >
        {t("cart.addToCart")}
      </button>
    </div>
  );
}
