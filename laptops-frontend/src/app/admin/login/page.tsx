"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ADMIN_SESSION_KEY,
  createAdminSessionToken,
  getAdminHintCredentials,
  validateAdminCredentials,
} from "@/lib/adminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (token) router.replace("/admin");
  }, [router]);

  const credentials = getAdminHintCredentials();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_25px_60px_-36px_rgba(8,20,43,0.75)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">LapStore Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">Use temporary credentials to access dashboard tools.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();

            if (!validateAdminCredentials(email, password)) {
              setError("Invalid credentials.");
              return;
            }

            setError(null);
            window.localStorage.setItem(ADMIN_SESSION_KEY, createAdminSessionToken());
            router.push("/admin");
          }}
        >
          <label className="block text-sm text-slate-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block text-sm text-slate-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            className="button-glow w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-cyan-400"
          >
            Sign in
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Temporary credentials</p>
          <p className="mt-1">Email: {credentials.email}</p>
          <p>Password: {credentials.password}</p>
        </div>

        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-600">
          ← Back to homepage
        </Link>
      </div>
    </div>
  );
}
