"use client";

import Link from "next/link";

import AppState from "@/components/AppState";
import { useConfirm } from "@/context/confirmContext";
import { useCartContext } from "@/context/cartContext";
import { useLanguageContext } from "@/context/languageContext";
import { useToast } from "@/context/toastContext";
import { formatPriceRon } from "@/lib/utils";

export default function CartPage() {
  const cartContext = useCartContext();
  const { t } = useLanguageContext();
  const { confirm } = useConfirm();
  const { notify } = useToast();

  const categoryLabelByValue = {
    gaming: t("category.gaming"),
    school: t("category.school"),
    ultrabook: t("category.ultrabook"),
  } as const;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{t("cart.title")}</p>
        <h1 className="mt-2 section-title text-slate-900">{t("cart.subtitle")}</h1>

        {cartContext.items.length === 0 ? (
          <AppState
            tone="empty"
            title="Your cart is empty"
            description={t("cart.empty")}
            actionLabel={t("cart.continueShopping")}
            actionHref="/"
            className="mt-6"
          />
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {cartContext.items.map((item) => (
                <div
                  key={item.product.id}
                  className="premium-soft-panel flex flex-col gap-4 rounded-2xl border border-slate-200/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.product.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.product.brand} · {categoryLabelByValue[item.product.category as keyof typeof categoryLabelByValue] ?? item.product.category}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {formatPriceRon(item.product.price)} {t("cart.each")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => cartContext.decrementItem(item.product.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => cartContext.incrementItem(item.product.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPriceRon(item.product.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        const accepted = await confirm({
                          title: "Remove item from cart?",
                          description: item.product.title,
                          confirmLabel: "Remove",
                          cancelLabel: "Cancel",
                          tone: "danger",
                        });
                        if (!accepted) return;
                        cartContext.removeItem(item.product.id);
                        notify({
                          tone: "info",
                          title: "Item removed from cart",
                          description: item.product.title,
                        });
                      }}
                      className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-rose-600 hover:underline"
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-semibold text-slate-900">
                {t("cart.subtotal")}: {formatPriceRon(cartContext.subtotal)}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const accepted = await confirm({
                      title: "Clear cart?",
                      description: "This will remove all items from your cart.",
                      confirmLabel: "Clear",
                      cancelLabel: "Cancel",
                      tone: "danger",
                    });
                    if (!accepted) return;
                    cartContext.clearCart();
                    notify({
                      tone: "success",
                      title: "Cart cleared",
                    });
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("cart.clear")}
                </button>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("cart.continueShopping")}
                </Link>
                <Link
                  href="/checkout"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {t("checkout.title")}
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
