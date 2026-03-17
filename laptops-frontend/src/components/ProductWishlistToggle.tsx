"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/context/toastContext";
import { hasUserSession } from "@/lib/userAuth";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function ProductWishlistToggle({
  productId,
  productTitle,
  compact = false,
  className = "",
}: {
  productId: number;
  productTitle?: string;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { has, hydrate, toggle } = useWishlistStore();
  const { notify } = useToast();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const active = has(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!hasUserSession()) {
          notify({
            tone: "info",
            title: "Please log in to use your wishlist",
          });
          router.push("/login");
          return;
        }

        const wasActive = active;
        toggle(productId);
        notify({
          tone: wasActive ? "info" : "success",
          title: wasActive ? "Removed from wishlist" : "Added to wishlist",
          description: productTitle,
        });
      }}
      className={`group inline-flex items-center justify-center rounded-full border transition-all duration-300 ${
        compact ? "h-8 w-8" : "h-10 w-10"
      } ${active ? "soft-glow-ring border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-500 hover:-translate-y-[1px] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"} ${className}`}
    >
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} className={`icon-shift ${compact ? "h-4 w-4" : "h-4.5 w-4.5"}`} aria-hidden="true">
        <path
          d="M12 20.5 4.8 13.3a4.7 4.7 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0L12 7.2l.6-.5a4.7 4.7 0 0 1 6.6 6.6L12 20.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
