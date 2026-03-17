"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductImageGalleryProps = {
  title: string;
  images?: string[];
};

export default function ProductImageGallery({ title, images }: ProductImageGalleryProps) {
  const galleryImages = useMemo(
    () => (images && images.length > 0 ? images : ["/laptop-placeholder.svg"]),
    [images]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = galleryImages[selectedIndex] || galleryImages[0] || "/laptop-placeholder.svg";
  const hasMultiple = galleryImages.length > 1;

  const showPrev = () => {
    setSelectedIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNext = () => {
    setSelectedIndex((prev) => (prev + 1) % galleryImages.length);
  };

  return (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
        <Image
          src={selected}
          alt={title}
          fill
          unoptimized
          className="max-h-full max-w-full object-contain object-center p-1 drop-shadow-[0_20px_28px_rgba(15,23,42,0.14)] transition duration-300 ease-out"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={showPrev}
              aria-label="Previous image"
              className="group absolute left-3 top-1/2 z-20 inline-flex h-13 w-13 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-slate-50/92 text-slate-700 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-slate-100/95 hover:shadow-[0_24px_44px_-24px_rgba(15,23,42,0.65)]"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5">
                <path d="m14.5 6.5-5 5.5 5 5.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next image"
              className="group absolute right-3 top-1/2 z-20 inline-flex h-13 w-13 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-slate-50/92 text-slate-700 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-slate-100/95 hover:shadow-[0_24px_44px_-24px_rgba(15,23,42,0.65)]"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5">
                <path d="m9.5 6.5 5 5.5-5 5.5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_54%,rgba(255,255,255,0.88)_100%)]" />
      </div>

      {hasMultiple ? (
        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 p-3">
          {galleryImages.map((img, index) => (
            <button
              key={img}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg border bg-white",
                selectedIndex === index ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
              )}
              aria-label={`Show image ${index + 1} for ${title}`}
            >
              <Image
                src={img}
                alt={`${title} image ${index + 1}`}
                fill
                unoptimized
                className="object-contain object-center p-1"
                sizes="(max-width: 1024px) 33vw, 160px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
