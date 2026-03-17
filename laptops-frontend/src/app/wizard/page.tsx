"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useLanguageContext } from "@/context/languageContext";
import { getProductScores } from "@/lib/productInsights";
import type { Product } from "@/lib/types";
import { formatPriceRon } from "@/lib/utils";
import { useProductsStore } from "@/store/useProductsStore";

type WizardState = {
  budget: number;
  useCase: "student" | "creator" | "gaming" | "business";
  preferredSize: "compact" | "balanced" | "large";
  gamingPriority: "yes" | "no";
  batteryPriority: "high" | "medium";
  portabilityPriority: "high" | "balanced";
};

type FinderLabel = "bestOverall" | "bestValue" | "premiumChoice";

type FinderResult = {
  label: FinderLabel;
  product: Product;
  reason: string;
  fitScore: number;
};

const defaultWizard: WizardState = {
  budget: 7000,
  useCase: "student",
  preferredSize: "balanced",
  gamingPriority: "no",
  batteryPriority: "medium",
  portabilityPriority: "balanced",
};

const steps = [
  "finder.step.budget",
  "finder.step.useCase",
  "finder.step.screenSize",
  "finder.step.gaming",
  "finder.step.battery",
  "finder.step.portability",
] as const;
const totalSteps = steps.length;
const finderMetrics = ["performance", "battery", "portability", "value"] as const;

function scoreForFinder(product: Product, wizard: WizardState): number {
  const scores = getProductScores(product);
  let score = scores.performance * 0.3 + scores.battery * 0.25 + scores.portability * 0.2 + scores.value * 0.25;

  if (wizard.useCase === "gaming" && product.category === "gaming") score += 12;
  if (wizard.useCase === "student" && (product.category === "school" || product.price <= wizard.budget * 0.9)) score += 10;
  if (wizard.useCase === "creator" && product.ram_gb >= 16) score += 9;
  if (wizard.useCase === "business" && product.category === "ultrabook") score += 9;

  if (wizard.gamingPriority === "yes" && (product.refresh_hz ?? 60) >= 120) score += 8;
  if (wizard.batteryPriority === "high" && product.battery_hours >= 9) score += 8;
  if (wizard.portabilityPriority === "high" && product.weight_kg <= 1.7) score += 8;

  if (wizard.preferredSize === "compact" && product.screen_inches <= 14) score += 6;
  if (wizard.preferredSize === "balanced" && product.screen_inches > 14 && product.screen_inches <= 15.6) score += 6;
  if (wizard.preferredSize === "large" && product.screen_inches > 15.6) score += 6;

  return Math.round(Math.min(100, score));
}

function OptionCard({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-blue-300 bg-blue-50 shadow-[0_18px_34px_-26px_rgba(37,99,235,0.5)]"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:bg-slate-50"
      }`}
    >
      <p className={`text-sm font-semibold ${active ? "text-blue-700" : "text-slate-900"}`}>{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
    </button>
  );
}

export default function RecommendationWizardPage() {
  const { products, fetch, isLoading } = useProductsStore();
  const { t } = useLanguageContext();
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(defaultWizard);

  const useCaseLabel =
    wizard.useCase === "student"
      ? t("finder.useCase.student.title")
      : wizard.useCase === "creator"
        ? t("finder.useCase.creator.title")
        : wizard.useCase === "gaming"
          ? t("finder.useCase.gaming.title")
          : t("finder.useCase.business.title");

  const sizeLabel =
    wizard.preferredSize === "compact"
      ? t("finder.size.compact.title")
      : wizard.preferredSize === "balanced"
        ? t("finder.size.balanced.title")
        : t("finder.size.large.title");

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const candidates = useMemo(() => {
    const withinReasonableBudget = products.filter((product) => product.price <= wizard.budget * 1.3);

    const byUseCase = (pool: Product[]) =>
      pool.filter((product) => {
        if (wizard.useCase === "gaming") return product.category === "gaming";
        if (wizard.useCase === "student") return product.price <= wizard.budget;
        if (wizard.useCase === "business") return product.weight_kg <= 2;
        return product.ram_gb >= 16;
      });

    const byPreferredSize = (pool: Product[]) =>
      pool.filter((product) => {
        if (wizard.preferredSize === "compact") return product.screen_inches <= 14;
        if (wizard.preferredSize === "large") return product.screen_inches >= 15.6;
        return product.screen_inches > 14 && product.screen_inches < 16;
      });

    const byPriorities = (pool: Product[]) =>
      pool
        .filter((product) => (wizard.gamingPriority === "yes" ? (product.refresh_hz ?? 60) >= 120 : true))
        .filter((product) => (wizard.batteryPriority === "high" ? product.battery_hours >= 8 : true))
        .filter((product) => (wizard.portabilityPriority === "high" ? product.weight_kg <= 1.9 : true));

    const strict = byPriorities(byPreferredSize(byUseCase(withinReasonableBudget)));
    if (strict.length > 0) return strict;

    const relaxedPriorities = byPreferredSize(byUseCase(withinReasonableBudget));
    if (relaxedPriorities.length > 0) return relaxedPriorities;

    const relaxedSize = byUseCase(withinReasonableBudget);
    if (relaxedSize.length > 0) return relaxedSize;

    return withinReasonableBudget;
  }, [products, wizard]);

  const ranked = useMemo(() => {
    return [...candidates]
      .map((product) => ({ product, fitScore: scoreForFinder(product, wizard) }))
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [candidates, wizard]);

  const results = useMemo<FinderResult[]>(() => {
    if (ranked.length === 0) return [];

    const bestOverallPool = [...ranked];
    const bestValuePool = [...ranked].sort((a, b) => {
      const valueDelta = getProductScores(b.product).value - getProductScores(a.product).value;
      if (valueDelta !== 0) return valueDelta;
      return a.product.price - b.product.price;
    });
    const premiumPool = [...ranked].sort((a, b) => b.product.price - a.product.price);

    const usedProductIds = new Set<number>();
    const pickUnique = (pool: Array<{ product: Product; fitScore: number }>) =>
      pool.find((entry) => !usedProductIds.has(entry.product.id));

    const assembled: FinderResult[] = [];

    const bestOverall = pickUnique(bestOverallPool);
    if (bestOverall) {
      usedProductIds.add(bestOverall.product.id);
      assembled.push({
        label: "bestOverall",
        product: bestOverall.product,
        reason: t("finder.reason.bestOverall", { title: bestOverall.product.title, useCase: useCaseLabel, size: sizeLabel }),
        fitScore: bestOverall.fitScore,
      });
    }

    const bestValue = pickUnique(bestValuePool);
    if (bestValue) {
      usedProductIds.add(bestValue.product.id);
      assembled.push({
        label: "bestValue",
        product: bestValue.product,
        reason: t("finder.reason.bestValue", { title: bestValue.product.title, useCase: useCaseLabel }),
        fitScore: bestValue.fitScore,
      });
    }

    const premiumChoice = pickUnique(premiumPool);
    if (premiumChoice) {
      usedProductIds.add(premiumChoice.product.id);
      assembled.push({
        label: "premiumChoice",
        product: premiumChoice.product,
        reason: t("finder.reason.premiumChoice", { title: premiumChoice.product.title }),
        fitScore: premiumChoice.fitScore,
      });
    }

    return assembled;
  }, [ranked, sizeLabel, t, useCaseLabel]);

  const complete = step > totalSteps;
  const progressPct = Math.round((Math.min(step, totalSteps) / totalSteps) * 100);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{t("finder.kicker")}</p>
        <h1 className="mt-2 text-[36px] font-bold leading-tight tracking-tight text-slate-900">{t("finder.title")}</h1>
        <p className="mt-2 text-[18px] text-slate-600">{t("finder.subtitle")}</p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>{t("finder.progress")}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[14px] text-slate-500 sm:grid-cols-6 sm:text-[15px]">
            {steps.map((labelKey, index) => {
              const current = index + 1 === Math.min(step, totalSteps);
              const done = index + 1 < step;
              return (
                <div key={labelKey} className={`rounded-full px-2 py-1 text-center font-semibold ${done ? "bg-blue-100 text-blue-700" : current ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {t(labelKey)}
                </div>
              );
            })}
          </div>
        </div>

        {!complete ? (
          <div className="premium-soft-panel mt-7 rounded-2xl p-5 sm:p-6">
            {step === 1 ? (
              <div>
                <p className="text-[20px] font-semibold text-slate-900">{t("finder.question.budget")}</p>
                <input
                  type="range"
                  min={3000}
                  max={12000}
                  step={100}
                  value={wizard.budget}
                  onChange={(event) => setWizard((prev) => ({ ...prev, budget: Number(event.target.value) }))}
                  className="mt-4 w-full accent-blue-600"
                />
                <p className="mt-2 text-base font-medium text-slate-600">{t("finder.budgetUpTo", { amount: formatPriceRon(wizard.budget) })}</p>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <p className="text-[20px] font-semibold text-slate-900">{t("finder.question.useCase")}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OptionCard active={wizard.useCase === "student"} title={t("finder.useCase.student.title")} subtitle={t("finder.useCase.student.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, useCase: "student" }))} />
                  <OptionCard active={wizard.useCase === "creator"} title={t("finder.useCase.creator.title")} subtitle={t("finder.useCase.creator.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, useCase: "creator" }))} />
                  <OptionCard active={wizard.useCase === "gaming"} title={t("finder.useCase.gaming.title")} subtitle={t("finder.useCase.gaming.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, useCase: "gaming" }))} />
                  <OptionCard active={wizard.useCase === "business"} title={t("finder.useCase.business.title")} subtitle={t("finder.useCase.business.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, useCase: "business" }))} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <p className="text-[20px] font-semibold text-slate-900">{t("finder.question.screenSize")}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <OptionCard active={wizard.preferredSize === "compact"} title={t("finder.size.compact.title")} subtitle={t("finder.size.compact.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, preferredSize: "compact" }))} />
                  <OptionCard active={wizard.preferredSize === "balanced"} title={t("finder.size.balanced.title")} subtitle={t("finder.size.balanced.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, preferredSize: "balanced" }))} />
                  <OptionCard active={wizard.preferredSize === "large"} title={t("finder.size.large.title")} subtitle={t("finder.size.large.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, preferredSize: "large" }))} />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <p className="text-[20px] font-semibold text-slate-900">{t("finder.question.gaming")}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OptionCard active={wizard.gamingPriority === "yes"} title={t("finder.gaming.yes.title")} subtitle={t("finder.gaming.yes.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, gamingPriority: "yes" }))} />
                  <OptionCard active={wizard.gamingPriority === "no"} title={t("finder.gaming.no.title")} subtitle={t("finder.gaming.no.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, gamingPriority: "no" }))} />
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div>
                <p className="text-[20px] font-semibold text-slate-900">{t("finder.question.battery")}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OptionCard active={wizard.batteryPriority === "high"} title={t("finder.battery.high.title")} subtitle={t("finder.battery.high.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, batteryPriority: "high" }))} />
                  <OptionCard active={wizard.batteryPriority === "medium"} title={t("finder.battery.medium.title")} subtitle={t("finder.battery.medium.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, batteryPriority: "medium" }))} />
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div>
                <p className="text-[20px] font-semibold text-slate-900">{t("finder.question.portability")}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <OptionCard active={wizard.portabilityPriority === "high"} title={t("finder.portability.high.title")} subtitle={t("finder.portability.high.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, portabilityPriority: "high" }))} />
                  <OptionCard active={wizard.portabilityPriority === "balanced"} title={t("finder.portability.balanced.title")} subtitle={t("finder.portability.balanced.subtitle")} onClick={() => setWizard((prev) => ({ ...prev, portabilityPriority: "balanced" }))} />
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex items-center justify-between">
              <button
                type="button"
                disabled={step <= 1}
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:opacity-50"
              >
                {t("finder.back")}
              </button>
              <button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                className="button-glow rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-cyan-400"
              >
                {step === totalSteps ? t("finder.showResults") : t("finder.next")}
              </button>
            </div>
          </div>
        ) : null}

        {complete ? (
          <div className="mt-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t("finder.resultsTitle")}</h2>
              <button
                type="button"
                onClick={() => {
                  setWizard(defaultWizard);
                  setStep(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                {t("finder.startAgain")}
              </button>
            </div>

            {isLoading ? <p className="mt-4 text-sm text-slate-600">{t("finder.preparing")}</p> : null}

            {!isLoading && results.length === 0 ? (
              <div className="premium-soft-panel mt-4 rounded-2xl p-6 text-sm text-slate-600">
                {t("finder.noMatch")}
                <Link href="/" className="ml-2 font-semibold text-blue-700 hover:text-blue-600">{t("finder.browseCatalog")}</Link>
              </div>
            ) : null}

            {!isLoading && results.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-5 xl:auto-rows-fr xl:grid-cols-3">
                {results.map((entry) => {
                  const scores = getProductScores(entry.product);
                  return (
                    <article key={`${entry.label}_${entry.product.id}`} className="premium-panel flex h-full flex-col rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                            {entry.label === "bestOverall" ? t("finder.result.bestOverall") : entry.label === "bestValue" ? t("finder.result.bestValue") : t("finder.result.premiumChoice")}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">{entry.product.title}</h3>
                          <p className="mt-1 text-xs text-slate-500">{entry.product.brand} · {entry.product.cpu}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold leading-none text-white">
                          {entry.fitScore}% Match
                        </span>
                      </div>

                      <p className="mt-3 min-h-[4.5rem] line-clamp-3 text-sm leading-6 text-slate-600">{entry.reason}</p>

                      <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-blue-700">{t("finder.price")}</p>
                        <p className="mt-1 text-xl font-semibold text-[#0d3f95]">{formatPriceRon(entry.product.price)}</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {finderMetrics.map((metric) => (
                          <div key={metric}>
                            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              <span>
                                {metric === "performance"
                                  ? t("finder.metric.performance")
                                  : metric === "battery"
                                    ? t("finder.metric.battery")
                                    : metric === "portability"
                                      ? t("finder.metric.portability")
                                      : t("finder.metric.value")}
                              </span>
                              <span>{scores[metric]}/100</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${scores[metric]}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-4">
                        <Link
                          href={`/products/${entry.product.id}`}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                        >
                          {t("finder.viewLaptop")}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
