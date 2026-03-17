"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AppState from "@/components/AppState";
import { useCartContext } from "@/context/cartContext";
import { useLanguageContext } from "@/context/languageContext";
import { useToast } from "@/context/toastContext";
import { formatPriceRon } from "@/lib/utils";
import { useOrdersStore } from "@/store/useOrdersStore";

export default function CheckoutPage() {
  const router = useRouter();
  const cartContext = useCartContext();
  const { t } = useLanguageContext();
  const { notify } = useToast();
  const { hydrated, hydrate, addOrder } = useOrdersStore();
  const [shipping, setShipping] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Romania",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "installments">("card");
  const [installmentPlan, setInstallmentPlan] = useState<"3" | "6" | "12">("3");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const placeOrder = () => {
    if (!shipping.fullName.trim() || !shipping.address.trim() || !shipping.city.trim()) {
      notify({
        tone: "error",
        title: t("checkout.invalidShippingTitle"),
        description: t("checkout.invalidShippingDescription"),
      });
      return;
    }

    const order = addOrder({
      items: cartContext.items,
      subtotal: cartContext.subtotal,
      shipping,
    });

    cartContext.clearCart();
    notify({
      tone: "success",
      title: t("checkout.orderPlaced"),
      description: `${t("checkout.orderNumber")} ${order.orderNumber}`,
    });
    router.push(`/order-success?orderId=${order.id}`);
  };

  if (cartContext.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="premium-panel rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
          <h1 className="mt-2 section-title text-slate-900">{t("checkout.title")}</h1>
          <AppState
            tone="empty"
            title={t("checkout.title")}
            description={t("checkout.empty")}
            actionLabel={t("cart.continueShopping")}
            actionHref="/"
            className="mt-6"
          />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 section-title text-slate-900">{t("checkout.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("checkout.subtitle")}</p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t("checkout.shipping")}</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                placeOrder();
              }}
            >
              <input
                type="text"
                placeholder={t("checkout.name")}
                value={shipping.fullName}
                onChange={(event) => setShipping((current) => ({ ...current, fullName: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="text"
                placeholder={t("checkout.address")}
                value={shipping.address}
                onChange={(event) => setShipping((current) => ({ ...current, address: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="text"
                placeholder={t("checkout.city")}
                value={shipping.city}
                onChange={(event) => setShipping((current) => ({ ...current, city: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder={t("checkout.postalCode")}
                  value={shipping.postalCode}
                  onChange={(event) => setShipping((current) => ({ ...current, postalCode: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  type="text"
                  placeholder={t("checkout.country")}
                  value={shipping.country}
                  onChange={(event) => setShipping((current) => ({ ...current, country: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <input
                type="tel"
                placeholder={t("checkout.phone")}
                value={shipping.phone}
                onChange={(event) => setShipping((current) => ({ ...current, phone: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Payment method</h3>
                <div className="mt-3 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>Credit / Debit Card</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>Cash on Delivery</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="installments"
                      checked={paymentMethod === "installments"}
                      onChange={() => setPaymentMethod("installments")}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>Pay in installments</span>
                  </label>
                </div>

                {paymentMethod === "card" ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Card number"
                      value={cardDetails.cardNumber}
                      onChange={(event) => setCardDetails((current) => ({ ...current, cardNumber: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Expiration date"
                      value={cardDetails.expiryDate}
                      onChange={(event) => setCardDetails((current) => ({ ...current, expiryDate: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      onChange={(event) => setCardDetails((current) => ({ ...current, cvv: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      placeholder="Cardholder name"
                      value={cardDetails.cardholderName}
                      onChange={(event) => setCardDetails((current) => ({ ...current, cardholderName: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:col-span-2"
                    />
                  </div>
                ) : null}

                {paymentMethod === "installments" ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Choose installment plan</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        { value: "3", label: "3 months" },
                        { value: "6", label: "6 months" },
                        { value: "12", label: "12 months" },
                      ].map((plan) => (
                        <label
                          key={plan.value}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/40"
                        >
                          <input
                            type="radio"
                            name="installmentPlan"
                            value={plan.value}
                            checked={installmentPlan === plan.value}
                            onChange={() => setInstallmentPlan(plan.value as "3" | "6" | "12")}
                            className="h-4 w-4 accent-blue-600"
                          />
                          <span>{plan.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!hydrated}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                {t("checkout.placeOrder")}
              </button>
            </form>
          </div>

          <aside className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t("checkout.summary")}</h2>
            <div className="mt-4 space-y-3">
              {cartContext.items.map((item) => (
                <div key={item.product.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product.title}</p>
                    <p className="text-xs text-slate-500">{item.quantity} × {formatPriceRon(item.product.price)}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{formatPriceRon(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <span>{t("cart.subtotal")}</span>
              <span>{formatPriceRon(cartContext.subtotal)}</span>
            </div>

            <Link href="/cart" className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-600">
              ← {t("header.cart")}
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
