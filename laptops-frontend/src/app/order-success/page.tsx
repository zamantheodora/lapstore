"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import AppState from "@/components/AppState";
import { useLanguageContext } from "@/context/languageContext";
import { formatPriceRon } from "@/lib/utils";
import { useOrdersStore } from "@/store/useOrdersStore";

export default function OrderSuccessPage() {
  const { t } = useLanguageContext();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { orders, hydrated, hydrate } = useOrdersStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const order = useMemo(() => {
    if (!orderId) return undefined;
    return orders.find((item) => item.id === orderId);
  }, [orders, orderId]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 section-title text-slate-900">{t("orderSuccess.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("orderSuccess.subtitle")}</p>

        {!hydrated ? <p className="mt-6 text-sm text-slate-600">Loading...</p> : null}

        {hydrated && !order ? (
          <AppState
            tone="error"
            title={t("orderSuccess.missingTitle")}
            description={t("orderSuccess.missingDescription")}
            actionLabel={t("orderSuccess.viewOrders")}
            actionHref="/account/orders"
            className="mt-6"
          />
        ) : null}

        {order ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("orderSuccess.orderNumber")}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{order.orderNumber}</p>
              <p className="mt-2 text-sm text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.product.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{item.product.title}</p>
                      <p className="text-xs text-slate-500">{item.quantity} × {formatPriceRon(item.product.price)}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatPriceRon(item.lineTotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t("orderSuccess.summary")}</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{order.shipping.fullName}</p>
                <p>{order.shipping.address}</p>
                <p>
                  {order.shipping.city} {order.shipping.postalCode}
                </p>
                <p>{order.shipping.country}</p>
                <p>{order.shipping.phone}</p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                <span>{t("cart.subtotal")}</span>
                <span>{formatPriceRon(order.subtotal)}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/account/orders"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {t("orderSuccess.viewOrders")}
                </Link>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("orderSuccess.continueShopping")}
                </Link>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </div>
  );
}
