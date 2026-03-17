"use client";

import { useChatStore } from "@/store/useChatStore";
import { useLanguageContext } from "@/context/languageContext";

type AnalyzeWithAIButtonProps = {
  productTitle: string;
};

export default function AnalyzeWithAIButton({ productTitle }: AnalyzeWithAIButtonProps) {
  const seedProductQuestion = useChatStore((s) => s.seedProductQuestion);
  const { language: uiLanguage, t } = useLanguageContext();

  return (
    <button
      type="button"
      onClick={() => seedProductQuestion(productTitle, uiLanguage)}
      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#0b3f91] to-[#1a7ec8] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition duration-300 hover:scale-[1.02] hover:from-[#0d4cae] hover:to-[#2093de] hover:shadow-lg"
      aria-label={`Analyze ${productTitle} with AI`}
    >
      {t("analyze.button")} · Quick analysis
    </button>
  );
}
