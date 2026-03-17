import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-r from-sky-50 via-white to-zinc-50 px-6 py-10 shadow-sm sm:px-8 lg:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          LapStore
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
          Găsește următorul tău laptop
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600 md:text-base">
          Compară prețuri, specificații și review-uri. Filtrează după buget, RAM și rată de refresh.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="#catalog"
            className="inline-flex items-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Shop laptopuri
          </Link>
          <Link
            href="#deals"
            className="inline-flex items-center rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Vezi oferte
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-20 -top-16 h-52 w-52 rounded-full bg-sky-100/90 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-zinc-100 blur-3xl" />
    </section>
  );
}
