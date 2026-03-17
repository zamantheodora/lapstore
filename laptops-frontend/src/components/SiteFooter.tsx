"use client";

import Link from "next/link";

import { useLanguageContext } from "@/context/languageContext";

export default function SiteFooter() {
  const { t } = useLanguageContext();

  return (
    <footer className="mt-14 border-t border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-panel rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-900">LapStore</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">{t("footer.tagline")}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("footer.products")}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.compareLaptops")}</Link>
              <Link href="/#catalog" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.categories")}</Link>
              <Link href="/cart" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.cart")}</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("footer.support")}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.about")}</Link>
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.contact")}</Link>
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.helpCenter")}</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Legal</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.shipping")}</Link>
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.returns")}</Link>
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.privacy")}</Link>
              <Link href="/" className="rounded-md px-1 py-1 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700">{t("footer.terms")}</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/80 pt-4 text-sm text-slate-500">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </div>
        </div>
      </div>
    </footer>
  );
}
