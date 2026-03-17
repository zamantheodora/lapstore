"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppState from "@/components/AppState";
import { useLanguageContext } from "@/context/languageContext";
import { hasUserSession } from "@/lib/userAuth";
import { formatPriceRon } from "@/lib/utils";
import { useOrdersStore } from "@/store/useOrdersStore";

export default function AccountOrdersPage() {
  const { t } = useLanguageContext();
  const { hydrated, hydrate, orders, cancelOrder } = useOrdersStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="premium-panel rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
          <h1 className="mt-2 section-title text-slate-900">{t("accountOrders.title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("accountOrders.subtitle")}</p>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Please log in to view your orders</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to track status, view details, and manage your purchases.</p>
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
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 section-title text-slate-900">{t("accountOrders.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("accountOrders.subtitle")}</p>

        {!hydrated ? <p className="mt-6 text-sm text-slate-600">Loading...</p> : null}

        {hydrated && orders.length === 0 ? (
          <AppState
            tone="empty"
            title={t("accountOrders.emptyTitle")}
            description={t("accountOrders.emptyDescription")}
            actionLabel={t("orderSuccess.continueShopping")}
            actionHref="/"
            className="mt-6"
          />
        ) : null}

        {orders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("accountOrders.orderNumber")}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{order.orderNumber}</p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === "processing"
                        ? "border border-blue-200 bg-blue-50 text-blue-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {t("accountOrders.status")}: {order.status === "processing" ? t("accountOrders.status.processing") : t("accountOrders.status.cancelled")}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {t("accountOrders.placedOn")}: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t("accountOrders.items").replace("{count}", String(order.items.length))}
                </p>

                <div className="mt-3 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
                  {formatPriceRon(order.subtotal)}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId((current) => (current === order.id ? null : order.id))}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {expandedOrderId === order.id ? "Hide details" : "View details"}
                  </button>
                  {order.status === "processing" ? (
                    <button
                      type="button"
                      onClick={() => cancelOrder(order.id)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Cancel order
                    </button>
                  ) : null}
                </div>

                {expandedOrderId === order.id ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shipping</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{order.shipping.fullName}</p>
                    <p className="text-sm text-slate-600">{order.shipping.address}</p>
                    <p className="text-sm text-slate-600">
                      {order.shipping.city} {order.shipping.postalCode}, {order.shipping.country}
                    </p>
                    <p className="text-sm text-slate-600">{order.shipping.phone}</p>

                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Items</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {order.items.map((item) => (
                        <li key={`${order.id}_${item.product.id}`} className="flex items-center justify-between gap-3">
                          <span>{item.product.title} × {item.quantity}</span>
                          <span className="font-semibold text-slate-900">{formatPriceRon(item.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        <Link href="/account" className="mt-6 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-600">
          ← {t("header.account.profile")}
        </Link>
      </section>
    </div>
  );
}
