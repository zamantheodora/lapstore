"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Backpack, Battery, Briefcase, CheckCircle2, Gamepad2, GraduationCap, HardDrive, Plug, Star, User, Wifi, Zap } from "lucide-react";

import AddToCartButton from "@/components/AddToCartButton";
import AnalyzeWithAIButton from "@/components/AnalyzeWithAIButton";
import AppState from "@/components/AppState";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ProductCompareToggle from "@/components/ProductCompareToggle";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductWishlistToggle from "@/components/ProductWishlistToggle";
import { useLanguageContext } from "@/context/languageContext";
import { getProduct, listProducts } from "@/lib/api";
import { getEstimatedDeliveryDays, getProductScores, getProsAndCons, hasPriceDrop, monthlyPayment, recommendedUseCases } from "@/lib/productInsights";
import type { Product } from "@/lib/types";
import { formatPriceRon } from "@/lib/utils";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function getStrengthIcon(item: string) {
  const normalized = item.toLowerCase();
  if (/memory|ram|multitask/.test(normalized)) return Zap;
  if (/battery/.test(normalized)) return Battery;
  if (/portable|portability|light/.test(normalized)) return Backpack;
  if (/storage|ssd/.test(normalized)) return HardDrive;
  return CheckCircle2;
}

function getIdealForIcon(item: string) {
  const normalized = item.toLowerCase();
  if (/student/.test(normalized)) return GraduationCap;
  if (/office|productivity|business|work/.test(normalized)) return Briefcase;
  if (/remote/.test(normalized)) return Wifi;
  if (/gaming|gamer/.test(normalized)) return Gamepad2;
  if (/travel|portable|on the go/.test(normalized)) return Backpack;
  return CheckCircle2;
}

function getBoxItemIcon(item: string) {
  const normalized = item.toLowerCase();
  if (normalized.includes("adapter")) return Plug;
  if (normalized.includes("charging") || normalized.includes("cable")) return Battery;
  if (normalized.includes("documentation")) return Briefcase;
  if (normalized.includes("laptop")) return HardDrive;
  return Briefcase;
}

type ReviewHighlight = {
  quote: string;
  reviewer: string;
  stars: number;
};

const REVIEW_TEXT_MAX_LENGTH = 500;

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguageContext();

  const categoryLabelByValue = {
    gaming: t("category.gaming"),
    school: t("category.school"),
    ultrabook: t("category.ultrabook"),
  } as const;

  const [product, setProduct] = useState<Product | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReviews, setUserReviews] = useState<ReviewHighlight[]>([]);
  const [reviewForm, setReviewForm] = useState({ stars: 5, name: "", text: "" });
  const { pushViewed, hydrate } = useRecentlyViewedStore();

  const productId = Number(params?.id);

  useEffect(() => {
    hydrate();

    let alive = true;

    async function loadProduct() {
      if (!Number.isFinite(productId)) {
        if (!alive) return;
        setError(t("productDetails.loadError"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await getProduct(productId);
        const all = await listProducts();
        if (!alive) return;
        setProduct(data);
        setCatalog(all);
        pushViewed(data.id);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : t("productDetails.loadError"));
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    void loadProduct();
    return () => {
      alive = false;
    };
  }, [productId, t, pushViewed, hydrate]);

  useEffect(() => {
    setShowAllReviews(false);
    setShowReviewForm(false);
    setUserReviews([]);
    setReviewForm({ stars: 5, name: "", text: "" });
  }, [productId]);

  const galleryImages = useMemo(
    () => (product?.images && product.images.length > 0 ? product.images : ["/laptop-placeholder.svg"]),
    [product]
  );
  const scores = useMemo(() => (product ? getProductScores(product) : null), [product]);
  const useCases = useMemo(() => (product ? recommendedUseCases(product) : []), [product]);
  const strengths = useMemo(() => {
    if (!product) return [];

    const fromInsights = getProsAndCons(product).pros;
    if (fromInsights.length > 0) return fromInsights.slice(0, 4);

    const fallback: string[] = [];
    if (product.ram_gb >= 16) fallback.push("Great multitasking memory");
    if (product.battery_hours >= 9) fallback.push("Long battery life");
    if (product.weight_kg <= 1.6) fallback.push("Very portable design");
    if (product.storage_gb >= 512) fallback.push("Solid SSD capacity for daily use");
    if (fallback.length === 0) fallback.push("Balanced everyday performance");
    return fallback.slice(0, 4);
  }, [product]);
  const idealFor = useMemo(() => {
    if (useCases.length > 0) return useCases.slice(0, 4);
    if (!product) return [];

    if (product.category === "school") return ["Students", "Daily productivity", "Remote work"];
    if (product.category === "gaming") return ["Gamers", "Streaming & media", "Creative workloads"];
    return ["Office productivity", "Business travel", "Remote work"];
  }, [product, useCases]);
  const similar = useMemo(() => {
    if (!product) return [];
    return catalog
      .filter((item) => item.id !== product.id)
      .filter((item) => item.category === product.category || item.brand === product.brand)
      .slice(0, 3);
  }, [catalog, product]);

  const reviewData = useMemo(() => {
    if (!product) {
      return {
        ratingValue: 4.6,
        reviewCount: 124,
        filledStars: 5,
        highlights: [] as ReviewHighlight[],
      };
    }

    const productWithReviewMeta = product as Product & {
      rating?: number;
      rating_avg?: number;
      average_rating?: number;
      review_count?: number;
      reviews_count?: number;
      total_reviews?: number;
    };

    const fallbackRating = 4.2 + ((product.id * 7) % 7) * 0.1;
    const ratingCandidate = Number(
      productWithReviewMeta.rating ?? productWithReviewMeta.rating_avg ?? productWithReviewMeta.average_rating ?? fallbackRating
    );
    const ratingValue = Number.isFinite(ratingCandidate) ? Math.max(3.8, Math.min(5, ratingCandidate)) : fallbackRating;

    const reviewNames = [
      "Andrei M.", "Ioana C.", "Radu P.", "Elena D.", "Mihai T.", "Bianca S.", "Vlad N.", "Larisa A.", "Cristian V.", "Teodora B.",
      "Alex M.", "Sofia R.", "Daniel P.", "Mara I.", "Victor T.", "Olivia G.", "Noah W.", "Emma J.", "Liam H.", "Ava K.",
      "Matei L.", "Anca F.", "Diana R.", "George C.", "Irina P.", "Paul S.", "Ana-Maria D.", "Kevin B.", "Isabella T.", "Ethan C.",
    ];

    const reviewQuotes = [
      "Foarte rapid în multitasking și nu se încălzește în utilizare normală.",
      "Bateria ține lejer o zi de lucru cu browser și documente.",
      "Ecran clar, culori bune, perfect pentru filme și lucru.",
      "Laptopul pornește repede și aplicațiile se deschid instant.",
      "Construcție solidă, tastatură comodă și trackpad precis.",
      "Merită prețul pentru performanța oferită.",
      "It feels snappy even with many tabs and apps open.",
      "Battery life is reliable for meetings and commuting.",
      "The display is bright and comfortable for long sessions.",
      "Great keyboard feedback and quiet fans most of the time.",
      "Excellent value for the specs and daily performance.",
      "Build quality feels premium and durable.",
      "Foarte bun pentru facultate și proiecte de zi cu zi.",
      "Silențios în task-uri office, exact ce căutam.",
      "Rulează jocuri surprinzător de bine pentru categoria lui.",
      "Camera web și microfonul sunt decente pentru call-uri.",
      "The chassis is lightweight and easy to carry around.",
      "Performance remains stable during longer workloads.",
      "Storage speed is excellent, file transfers are quick.",
      "A practical laptop with balanced performance and portability.",
      "Sunetul este clar, iar imaginea este plăcută pentru streaming.",
      "Nu am avut blocări sau lag până acum, merge impecabil.",
      "Good thermals and no annoying throttling in my usage.",
      "Perfect for office tasks, media, and occasional editing.",
      "E ușor de transportat și autonomia chiar impresionează.",
      "Very dependable for daily work and remote meetings.",
      "Tastele sunt bine spațiate, scrisul e confortabil.",
      "The fan profile is well tuned and not distracting.",
      "Raport calitate-preț foarte bun pentru ce oferă.",
      "It handles productivity and light creative tasks really well.",
      "Ideal pentru utilizare mixtă: office, browsing și entertainment.",
      "Display calibration is decent out of the box.",
      "L-am cumpărat pentru mobilitate și exact asta oferă.",
      "Fast boot times and smooth day-to-day responsiveness.",
      "Pentru gaming casual și muncă, este mai mult decât suficient.",
      "The overall experience is polished and hassle-free.",
    ];

    const targetReviewLength = 10 + (product.id % 3);
    const nameStep = 5 + (product.id % 7);
    const quoteStep = 7 + (product.id % 9);
    const nameStart = (product.id * 3) % reviewNames.length;
    const quoteStart = (product.id * 5) % reviewQuotes.length;

    const highlights = Array.from({ length: targetReviewLength }).map((_, index) => ({
      reviewer: reviewNames[(nameStart + index * nameStep) % reviewNames.length],
      quote: reviewQuotes[(quoteStart + index * quoteStep) % reviewQuotes.length],
      stars: 4 + ((product.id + index) % 2),
    }));

    const fallbackReviewCount = highlights.length * (7 + (product.id % 5));
    const countCandidate = Number(
      productWithReviewMeta.review_count ?? productWithReviewMeta.reviews_count ?? productWithReviewMeta.total_reviews ?? fallbackReviewCount
    );
    const reviewCount = Number.isFinite(countCandidate) ? Math.max(12, Math.round(countCandidate)) : fallbackReviewCount;

    return {
      ratingValue,
      reviewCount,
      filledStars: Math.max(1, Math.min(5, Math.round(ratingValue))),
      highlights,
    };
  }, [product]);

  const allReviews = useMemo(() => [...userReviews, ...reviewData.highlights], [userReviews, reviewData.highlights]);
  const visibleReviews = showAllReviews ? allReviews : allReviews.slice(0, 3);
  const displayedReviewCount = reviewData.reviewCount + userReviews.length;
  const displayedRating = useMemo(() => {
    if (userReviews.length === 0) return reviewData.ratingValue;
    const baseRatingTotal = reviewData.ratingValue * reviewData.reviewCount;
    const userRatingTotal = userReviews.reduce((sum, review) => sum + review.stars, 0);
    return (baseRatingTotal + userRatingTotal) / displayedReviewCount;
  }, [displayedReviewCount, reviewData.ratingValue, reviewData.reviewCount, userReviews]);
  const displayedFilledStars = Math.max(1, Math.min(5, Math.round(displayedRating)));

  const boxContents = ["Laptop", "Power adapter", "Charging cable", "Documentation"];

  function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = reviewForm.name.trim();
    const text = reviewForm.text.trim();
    if (!name || !text) return;

    setUserReviews((previous) => [{ reviewer: name, quote: text, stars: reviewForm.stars }, ...previous]);
    setReviewForm({ stars: 5, name: "", text: "" });
    setShowReviewForm(false);
    setShowAllReviews(true);
  }

  function handleReviewCancel() {
    setShowReviewForm(false);
    setReviewForm({ stars: 5, name: "", text: "" });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-700 shadow-[0_10px_22px_-18px_rgba(15,23,42,0.5)] transition-all duration-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5">
              <path d="m14.5 6.5-5 5.5 5 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ProductCardSkeleton key={`product_details_skeleton_${index}`} />
            ))}
          </div>
        ) : null}

        {error ? (
          <AppState tone="error" title="Could not load product details" description={error} actionLabel="Back to catalog" actionHref="/" className="mt-6" />
        ) : null}

        {product ? (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="premium-panel overflow-hidden rounded-3xl">
                <ProductImageGallery title={product.title} images={galleryImages} />
                <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {product.brand} · {categoryLabelByValue[product.category as keyof typeof categoryLabelByValue] ?? product.category}
                </p>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <h1 className="section-title text-slate-900">
                    {product.title}
                  </h1>
                  <div className="flex shrink-0 items-center gap-2">
                    <ProductWishlistToggle
                      productId={product.id}
                      productTitle={product.title}
                      className="shadow-[0_10px_22px_-18px_rgba(15,23,42,0.55)] hover:shadow-[0_16px_28px_-20px_rgba(15,23,42,0.6)]"
                    />
                    <ProductCompareToggle
                      productId={product.id}
                      productTitle={product.title}
                      iconOnly
                      className="shadow-[0_10px_22px_-18px_rgba(15,23,42,0.55)] hover:shadow-[0_16px_28px_-20px_rgba(15,23,42,0.6)]"
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>

                {hasPriceDrop(product) ? (
                  <p className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Recently dropped in price
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 shadow-[0_20px_38px_-32px_rgba(37,99,235,0.5)]">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight text-indigo-600">{formatPriceRon(product.price)}</p>
                    <p className="mt-1 text-xs text-slate-600">from {formatPriceRon(monthlyPayment(product))}/month</p>
                    <p className="mt-1 text-xs text-slate-500">{getEstimatedDeliveryDays(product)}</p>
                  </div>
                  <div className="flex items-stretch">
                    <AddToCartButton product={product} />
                  </div>
                </div>

                {scores ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Object.entries(scores).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{key}</p>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                          <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${value}%` }} />
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{value}/100</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="premium-panel rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/40 p-6 transition duration-300 hover:shadow-[0_28px_56px_-40px_rgba(15,23,42,0.58)]">
                <h3 className="text-base font-semibold text-slate-900">{t("productDetails.aiTitle")}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {t("productDetails.aiSubtitle")}
                </p>
                <div className="mt-4">
                  <AnalyzeWithAIButton productTitle={product.title} />
                </div>
              </div>

              <div className="premium-panel rounded-2xl p-6">
                <h2 className="text-base font-semibold text-slate-900">Strengths & Ideal for</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Strengths</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {strengths.map((item) => {
                        const Icon = getStrengthIcon(item);
                        return (
                          <li key={item} className="flex items-start gap-2.5">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Ideal for</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {idealFor.map((item) => {
                        const Icon = getIdealForIcon(item);
                        return (
                          <li key={item} className="flex items-start gap-2.5">
                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="premium-panel rounded-2xl p-6">
                <h2 className="text-base font-semibold text-slate-900">What&apos;s in the box</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {boxContents.map((item) => {
                    const Icon = getBoxItemIcon(item);
                    return (
                      <li key={item} className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="premium-panel rounded-2xl p-6">
                <h2 className="text-base font-semibold text-slate-900">{t("productDetails.specsTitle")}</h2>
                <div className="mt-2 divide-y divide-slate-100">
                  <SpecRow label={t("productDetails.spec.cpu")} value={product.cpu} />
                  <SpecRow label={t("productDetails.spec.gpu")} value={product.gpu} />
                  <SpecRow label={t("productDetails.spec.ram")} value={`${product.ram_gb} GB`} />
                  <SpecRow label={t("productDetails.spec.storage")} value={`${product.storage_gb} GB`} />
                  <SpecRow label={t("productDetails.spec.display")} value={`${product.screen_inches}" · ${product.resolution}`} />
                  <SpecRow label={t("productDetails.spec.refreshRate")} value={product.refresh_hz ? `${product.refresh_hz} Hz` : "—"} />
                  <SpecRow label={t("productDetails.spec.weight")} value={`${product.weight_kg} kg`} />
                  <SpecRow label={t("productDetails.spec.battery")} value={`${product.battery_hours} h`} />
                  <SpecRow label={t("productDetails.spec.os")} value={product.os} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {product ? (
          <div className="premium-panel mt-6 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-slate-900">Customer reviews</h2>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/80 px-2.5 py-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`review_star_${index}`}
                    className={`h-3.5 w-3.5 ${index < displayedFilledStars ? "fill-amber-400 text-amber-400" : "fill-amber-200 text-amber-200"}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-800">{displayedRating.toFixed(1)} / 5</p>
            </div>
            <p className="mt-2 text-sm text-slate-600">Based on {displayedReviewCount} reviews</p>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 text-sm text-slate-700 md:grid-cols-3">
              {visibleReviews.map((review, index) => (
                <li key={`${review.reviewer}_${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="mb-1.5 inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={`review_item_star_${index}_${starIndex}`}
                        className={`h-3.5 w-3.5 ${starIndex < review.stars ? "fill-amber-400 text-amber-400" : "fill-amber-200 text-amber-200"}`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p>&quot;{review.quote}&quot;</p>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{review.reviewer}</span>
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {allReviews.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setShowAllReviews((previous) => !previous)}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50"
                >
                  {showAllReviews ? "Show fewer reviews" : "View all reviews"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShowReviewForm((previous) => !previous)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50"
              >
                Write a review
              </button>
            </div>
            {showReviewForm ? (
              <form onSubmit={handleReviewSubmit} className="mt-4 max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Star rating
                  <select
                    value={reviewForm.stars}
                    onChange={(event) => setReviewForm((previous) => ({ ...previous, stars: Number(event.target.value) }))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 focus:ring"
                  >
                    {[5, 4, 3, 2, 1].map((star) => (
                      <option key={`review_star_option_${star}`} value={star}>
                        {star} star{star === 1 ? "" : "s"}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(event) => setReviewForm((previous) => ({ ...previous, name: event.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 focus:ring"
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Review
                  <textarea
                    value={reviewForm.text}
                    onChange={(event) => setReviewForm((previous) => ({ ...previous, text: event.target.value }))}
                    maxLength={REVIEW_TEXT_MAX_LENGTH}
                    className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 focus:ring"
                    placeholder="Share your experience with this laptop"
                    required
                  />
                  <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-slate-500">
                    {reviewForm.text.length}/{REVIEW_TEXT_MAX_LENGTH}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-700"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={handleReviewCancel}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {similar.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Similar laptops</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {similar.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}
    </div>
  );
}
