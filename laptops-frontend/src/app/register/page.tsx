"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLanguageContext } from "@/context/languageContext";
import { registerUserCredentials } from "@/lib/userAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguageContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitRegistration = () => {
    registerUserCredentials(email, password);
    router.push("/login");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.3)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{t("register.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("register.subtitle")}</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitRegistration();
          }}
        >
          <div>
            <label htmlFor="register-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("register.name")}
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("register.email")}
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("register.password")}
            </label>
            <input
              id="register-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {t("register.submit")}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          {t("register.haveAccount")} {" "}
          <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-600">
            {t("register.signIn")}
          </Link>
        </p>
      </section>
    </div>
  );
}
