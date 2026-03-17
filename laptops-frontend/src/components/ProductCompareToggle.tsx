"use client";

import { useEffect } from "react";

import { useLanguageContext } from "@/context/languageContext";
import { useToast } from "@/context/toastContext";
import { useCompareStore } from "@/store/useCompareStore";

export default function ProductCompareToggle({
  productId,
  productTitle,
  compact = false,
  iconOnly = false,
  className = "",
}: {
  productId: number;
  productTitle?: string;
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const { ids, hydrate, toggle, canAdd } = useCompareStore();
  const { notify } = useToast();
  const { t } = useLanguageContext();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const selected = ids.includes(productId);
  const disabled = !selected && !canAdd(productId);

  const baseTone = selected
    ? "border-blue-300 bg-blue-50 text-blue-700 shadow-[0_8px_16px_-14px_rgba(37,99,235,0.5)]"
    : "border-slate-200 bg-white text-slate-700 hover:-translate-y-[1px] hover:border-blue-200 hover:bg-blue-50";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={selected ? t("compare.selected") : t("compare.compare")}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) {
          notify({
            tone: "error",
            title: t("compare.limitTitle"),
            description: t("compare.limitDescription"),
          });
          return;
        }
        const wasSelected = selected;
        toggle(productId);
        notify({
          tone: wasSelected ? "info" : "success",
          title: wasSelected ? t("compare.removed") : t("compare.added"),
          description: productTitle,
        });
      }}
      className={`inline-flex items-center justify-center border font-semibold transition-all duration-300 ${
        iconOnly
          ? compact
            ? "h-8 w-8 rounded-full"
            : "h-10 w-10 rounded-full"
          : compact
            ? "h-9 w-full rounded-lg px-3 text-xs"
            : "h-10 rounded-xl px-4 text-sm"
      } ${baseTone} ${className} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {iconOnly ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={compact ? "h-4 w-4" : "h-4.5 w-4.5"}>
          <path d="M7 7h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="m15 4 4 3-4 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 17H5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="m9 14-4 3 4 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : selected ? t("compare.selected") : t("compare.compare")}
    </button>
  );
}
