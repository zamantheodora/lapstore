"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLanguageContext } from "@/context/languageContext";
import { createUserSession, validateLoginCredentials } from "@/lib/userAuth";

const DEMO_EMAIL = "demo@lapstore.local";
const DEMO_PASSWORD = "LapStoreDemo2026!";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguageContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLogin = () => {
    if (!validateLoginCredentials(email, password)) {
      setError("Invalid email or password.");
      return;
    }
    setError(null);
    createUserSession();
    router.push("/account");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.3)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{t("login.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("login.subtitle")}</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitLogin();
          }}
        >
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("login.email")}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("login.password")}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((current) => !current)}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                    <path d="M4 5l16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M10.6 10.1a3 3 0 0 0 3.8 3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M9.1 5.5A11.4 11.4 0 0 1 12 5c4.6 0 8.2 2.8 9.8 7-0.5 1.2-1.2 2.2-2 3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M6.2 7.5C4.8 8.7 3.6 10.2 2.8 12c1.6 4.2 5.2 7 9.8 7 1.5 0 2.9-0.3 4.1-0.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                    <path d="M2.8 12C4.4 7.8 8 5 12 5s7.6 2.8 9.2 7c-1.6 4.2-5.2 7-9.2 7s-7.6-2.8-9.2-7Z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <span>Keep me logged in</span>
          </label>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {t("login.submit")}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
              setError(null);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-500 transition hover:border-blue-200 hover:bg-blue-50/60 hover:text-slate-600"
          >
            <p className="font-semibold text-slate-600">Demo account</p>
            <p className="mt-1">Email: {DEMO_EMAIL}</p>
            <p>Password: {DEMO_PASSWORD}</p>
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          {t("login.noAccount")} {" "}
          <Link href="/register" className="font-semibold text-blue-700 hover:text-blue-600">
            {t("login.create")}
          </Link>
        </p>
      </section>
    </div>
  );
}
