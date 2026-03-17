import { create } from "zustand";

import type { ChatResponse, Product } from "@/lib/types";
import { chat as chatApi } from "@/lib/api";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: Product[];
  quickActions?: { label: string; prompt: string }[];
};

type ChatState = {
  isOpen: boolean;
  isSending: boolean;
  error: string | null;
  sessionId: string;
  messages: ChatMessage[];
  draft: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  ensureSession: () => void;
  setDraft: (text: string) => void;
  sendMessage: (text: string, uiLanguage?: "ro" | "en", options?: { forceNewTopic?: boolean }) => Promise<void>;
  seedProductQuestion: (productTitle: string, uiLanguage?: "ro" | "en") => void;
};

const STORAGE_KEY = "laptops.chat.session_id";
const LANGUAGE_STORAGE_KEY = "lapstore-ui-language";

const KNOWN_BRANDS = [
  "lenovo",
  "asus",
  "acer",
  "dell",
  "hp",
  "apple",
  "msi",
  "huawei",
  "samsung",
  "razer",
  "gigabyte",
  "microsoft",
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function extractProductCandidate(message: string): string | null {
  const normalized = normalizeText(message);
  if (!normalized) return null;

  const directProductRegex = /(?:tell me about|spune mi despre|about|details for|detalii despre)\s+([a-z0-9\s\-]+)/i;
  const directMatch = message.match(directProductRegex);
  if (directMatch?.[1]) {
    return normalizeText(directMatch[1]).slice(0, 80) || null;
  }

  for (const brand of KNOWN_BRANDS) {
    const index = normalized.indexOf(`${brand} `);
    if (index !== -1) {
      const tail = normalized.slice(index).split(" ").slice(0, 8).join(" ").trim();
      if (tail.split(" ").length >= 2) return tail;
    }
  }

  return null;
}

function isGeneralSearchQuery(message: string): boolean {
  const normalized = normalizeText(message);
  return /(under|sub|budget|gaming|student|ultrabook|best value|long battery|portability|cheap|performance|category)/.test(normalized);
}

function isLikelyFollowUp(message: string): boolean {
  const normalized = normalizeText(message);
  return /^(and|also|what about|how about|compare|vs|versus|dar|si|also compare|is it|what s the battery|does it|can it|this|that)\b/.test(normalized);
}

function classifyTopic(message: string): "product" | "general" | "other" {
  if (extractProductCandidate(message)) return "product";
  if (isGeneralSearchQuery(message)) return "general";
  return "other";
}

function shouldResetContextForMessage(latestMessage: string, previousUserMessage?: string): boolean {
  if (!previousUserMessage) return false;
  if (isLikelyFollowUp(latestMessage)) return false;

  const prevTopic = classifyTopic(previousUserMessage);
  const latestTopic = classifyTopic(latestMessage);
  const prevProduct = extractProductCandidate(previousUserMessage);
  const latestProduct = extractProductCandidate(latestMessage);

  if (latestProduct && prevProduct && latestProduct !== prevProduct) {
    return true;
  }

  if (latestTopic === "product" && prevTopic !== "product") {
    return true;
  }

  if (latestTopic === "general" && prevTopic === "product") {
    return true;
  }

  if (latestTopic === "other" && prevTopic !== "other") {
    return true;
  }

  return false;
}

function isFitAssessmentQuestion(message: string): boolean {
  const normalized = normalizeText(message);
  return /(good fit|fit for me|is it good|should i buy|worth it|is this good for|e bun pentru|se merita|potrivit pentru mine)/.test(normalized);
}

function parseBudgetLimit(message: string): number | null {
  const normalized = normalizeText(message);
  const budgetMatch = normalized.match(/(?:under|sub|below|max|buget)\s*(\d{3,6})/i);
  if (!budgetMatch?.[1]) return null;
  const parsed = Number(budgetMatch[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickPrimaryProduct(message: string, results: Product[]): Product | null {
  if (results.length === 0) return null;

  const candidate = extractProductCandidate(message);
  if (!candidate) return results[0];

  const candidateTokens = candidate.split(" ").filter((token) => token.length > 2);
  if (candidateTokens.length === 0) return results[0];

  const match = results.find((product) => {
    const title = normalizeText(product.title);
    const matches = candidateTokens.filter((token) => title.includes(token)).length;
    return matches >= Math.max(2, Math.floor(candidateTokens.length / 2));
  });

  return match ?? results[0];
}

function verdictForProductFit(message: string, product: Product): "yes" | "partially" | "not_ideal" {
  const normalized = normalizeText(message);
  const budget = parseBudgetLimit(message);
  const asksGaming = /gaming|esports|fps|aaa/.test(normalized);
  const asksPortability = /portable|portability|travel|light|student|college/.test(normalized);
  const asksBattery = /battery|autonomy|autonomie/.test(normalized);

  if (budget && product.price > budget * 1.08) return "not_ideal";

  const hasDedicatedGpu = !/iris|integrated|uhd|radeon graphics/i.test(product.gpu);
  if (asksGaming && !hasDedicatedGpu) return "not_ideal";

  let fitScore = 0;
  if (product.ram_gb >= 16) fitScore += 1;
  if (product.storage_gb >= 512) fitScore += 1;
  if (product.battery_hours >= 8) fitScore += 1;
  if (product.weight_kg <= 1.7) fitScore += 1;

  if (asksPortability && product.weight_kg <= 1.7) fitScore += 1;
  if (asksBattery && product.battery_hours >= 9) fitScore += 1;

  if (fitScore >= 4) return "yes";
  if (fitScore >= 2) return "partially";
  return "not_ideal";
}

function inferCategoryLabels(product: Product): string[] {
  if (product.category === "gaming") {
    return ["Gaming", "Performance", "Creative workloads"];
  }

  if (product.category === "school") {
    return ["School", "Daily productivity", "Remote work"];
  }

  if (product.weight_kg <= 1.6 && product.battery_hours >= 8) {
    return ["Business", "Productivity", "Remote work"];
  }

  return ["Productivity", "Business", "Daily use"];
}

function pricePositionLabel(price: number): string {
  if (price <= 4500) return "budget-friendly";
  if (price <= 8000) return "mid-range";
  return "premium";
}

function buildSpecInterpretation(product: Product): string[] {
  const hasDedicatedGpu = !/iris|integrated|uhd|radeon graphics/i.test(product.gpu);
  const performanceRead = hasDedicatedGpu
    ? "CPU + dedicated GPU can handle heavier workflows and smoother gaming"
    : "CPU is fine for daily tasks, but graphics power is aimed more at office/school use";
  const memoryRead =
    product.ram_gb >= 16
      ? `${product.ram_gb}GB RAM supports comfortable multitasking with many tabs/apps`
      : `${product.ram_gb}GB RAM is better for light-to-medium multitasking than pro-heavy workloads`;
  const batteryRead =
    product.battery_hours >= 8
      ? `${product.battery_hours}h battery should cover most classes/meetings without frequent charging`
      : `${product.battery_hours}h battery means you should expect charging during longer days`;
  const portabilityRead =
    product.weight_kg <= 1.7
      ? `${product.weight_kg}kg chassis is practical for commuting and campus use`
      : `${product.weight_kg}kg build is more desk-friendly than carry-all-day portable`;
  const priceRead = `${product.price.toLocaleString("en-US")} places it in the ${pricePositionLabel(product.price)} segment.`;

  return [performanceRead, memoryRead, batteryRead, portabilityRead, priceRead];
}

function buildUseCaseSuitability(product: Product): string[] {
  const hasDedicatedGpu = !/iris|integrated|uhd|radeon graphics/i.test(product.gpu);
  const studentFit =
    product.battery_hours >= 8 && product.weight_kg <= 1.8
      ? "Students: good for classes, note-taking, and everyday coursework."
      : "Students: usable, but battery/weight trade-offs may be noticeable on long days.";
  const officeFit =
    product.ram_gb >= 16
      ? "Office/productivity: strong for multitasking, documents, calls, and browser-heavy work."
      : "Office/productivity: fine for standard work, less comfortable with very heavy multitasking.";
  const portabilityFit =
    product.weight_kg <= 1.7
      ? "Portability: easy to travel with regularly."
      : "Portability: better if you mostly work from one location.";
  const gamingFit = hasDedicatedGpu
    ? "Gaming/graphics: suitable for moderate gaming and GPU-accelerated tasks depending on settings."
    : "Gaming/graphics: not ideal for modern AAA gaming or heavy graphics workloads.";

  return [studentFit, officeFit, portabilityFit, gamingFit];
}

function buildPotentialLimitations(product: Product): string[] {
  const limitations: string[] = [];
  const hasDedicatedGpu = !/iris|integrated|uhd|radeon graphics/i.test(product.gpu);

  if (!hasDedicatedGpu) {
    limitations.push("Integrated graphics limit modern AAA gaming and heavy 3D/graphics rendering.");
  }
  if (product.ram_gb < 16) {
    limitations.push(`${product.ram_gb}GB RAM can become a bottleneck with many demanding apps open.`);
  }
  if (product.battery_hours < 8) {
    limitations.push(`${product.battery_hours}h battery is shorter for full-day unplugged usage.`);
  }
  if (product.storage_gb < 512) {
    limitations.push(`${product.storage_gb}GB storage may fill quickly if you install larger apps/games.`);
  }
  if (product.weight_kg > 1.9) {
    limitations.push(`${product.weight_kg}kg weight can feel heavy for daily commuting.`);
  }
  if (product.price > 8000) {
    limitations.push(`Price is premium, so value depends on whether you need this performance tier.`);
  }

  if (limitations.length === 0) {
    limitations.push("Balanced overall, but still not the most efficient option if your needs are only basic browsing and office tasks.");
  }

  return limitations.slice(0, 3);
}

function alternativeReason(primary: Product, alternative: Product): string {
  if (alternative.price < primary.price) {
    return `better budget fit (${alternative.price.toLocaleString("en-US")} vs ${primary.price.toLocaleString("en-US")})`;
  }
  if (alternative.battery_hours > primary.battery_hours) {
    return `longer battery life (${alternative.battery_hours}h vs ${primary.battery_hours}h)`;
  }
  if (alternative.weight_kg < primary.weight_kg) {
    return `more portable (${alternative.weight_kg}kg vs ${primary.weight_kg}kg)`;
  }
  if (alternative.ram_gb > primary.ram_gb) {
    return `more multitasking headroom (${alternative.ram_gb}GB RAM)`;
  }
  return `strong alternative depending on your exact priorities`;
}

function buildFitAssessmentResponse(message: string, response: ChatResponse, language: "ro" | "en"): string | null {
  if (!isFitAssessmentQuestion(message)) return null;
  if (!response.results || response.results.length === 0) {
    return fallbackAssistantMessage(language);
  }

  const primary = pickPrimaryProduct(message, response.results);
  if (!primary) return fallbackAssistantMessage(language);

  const verdict = verdictForProductFit(message, primary);
  const verdictText =
    verdict === "yes"
      ? "Yes"
      : verdict === "partially"
        ? "Partially"
        : "Not ideal";

  const alternatives = response.results.filter((item) => item.id !== primary.id).slice(0, 2);
  const categoryLabels = inferCategoryLabels(primary);
  const interpretation = buildSpecInterpretation(primary);
  const useCaseSuitability = buildUseCaseSuitability(primary);
  const potentialLimitations = buildPotentialLimitations(primary);

  const lines: string[] = [];
  lines.push(`${verdictText} — ${primary.title} ${verdict === "yes" ? "is a good fit" : verdict === "partially" ? "can be a fit with trade-offs" : "is not the best fit"} for this request.`);
  lines.push("");
  lines.push(`Category: ${categoryLabels.join(" / ")}`);
  lines.push("");
  lines.push("Category fit summary:");
  lines.push(`- CPU performance: ${primary.cpu}`);
  lines.push(`- RAM: ${primary.ram_gb}GB (${primary.ram_gb >= 16 ? "strong for multitasking" : "ok for light-to-medium workloads"})`);
  lines.push(`- Battery life: about ${primary.battery_hours}h (${primary.battery_hours >= 8 ? "good for mobile use" : "better for shorter sessions"})`);
  lines.push(`- Portability: ${primary.weight_kg}kg (${primary.weight_kg <= 1.7 ? "easy to carry" : "less travel-friendly"})`);
  lines.push(`- Price level: ${pricePositionLabel(primary.price)} (${primary.price.toLocaleString("en-US")})`);
  lines.push("");
  lines.push("What these specs mean in practice:");
  interpretation.forEach((item) => lines.push(`- ${item}`));

  if (useCaseSuitability.length > 0) {
    lines.push("");
    lines.push("Use-case suitability:");
    useCaseSuitability.forEach((item) => lines.push(`- ${item}`));
  }

  if (potentialLimitations.length > 0) {
    lines.push("");
    lines.push("Potential limitations:");
    potentialLimitations.forEach((item) => lines.push(`- ${item}`));
  }

  if (alternatives.length > 0) {
    lines.push("");
    lines.push("Relevant alternatives:");
    alternatives.forEach((alt) => {
      lines.push(`- ${alt.title}: ${alternativeReason(primary, alt)}`);
    });
  }

  return lines.join("\n");
}

function fallbackAssistantMessage(language: "ro" | "en"): string {
  return language === "ro"
    ? "Nu am suficiente informații ca să răspund sigur. Îmi poți reformula întrebarea sau spune exact ce model și buget te interesează?"
    : "I don’t have enough reliable context to answer that confidently. Could you rephrase or share the exact model and budget you care about?";
}

function generateSessionId(): string {
  return `sess_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function detectUiLanguage(explicit?: "ro" | "en"): "ro" | "en" {
  if (explicit) return explicit;
  if (typeof window === "undefined") return "en";

  const htmlLang = document.documentElement.lang?.toLowerCase() || "";
  const navigatorLang = window.navigator.language?.toLowerCase() || "";
  const candidate = htmlLang || navigatorLang;
  return candidate.startsWith("ro") ? "ro" : "en";
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  isSending: false,
  error: null,
  sessionId: "",
  messages: [],
  draft: "",

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  setDraft: (text: string) => set({ draft: text }),

  ensureSession: () => {
    if (typeof window === "undefined") return;

    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      if (!get().sessionId) set({ sessionId: existing });
      return;
    }

    const next = generateSessionId();
    window.localStorage.setItem(STORAGE_KEY, next);
    set({ sessionId: next });
  },

  sendMessage: async (text: string, uiLanguage?: "ro" | "en", options?: { forceNewTopic?: boolean }) => {
    const trimmed = text.trim();
    if (!trimmed || get().isSending) return;

    const language =
      uiLanguage ||
      (typeof window !== "undefined" ? (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as "ro" | "en" | null) || undefined : undefined) ||
      detectUiLanguage();

    const previousUserMessage = [...get().messages].reverse().find((msg) => msg.role === "user")?.content;
    const shouldResetContext = options?.forceNewTopic || shouldResetContextForMessage(trimmed, previousUserMessage);

    if (shouldResetContext && typeof window !== "undefined") {
      const freshSessionId = generateSessionId();
      window.localStorage.setItem(STORAGE_KEY, freshSessionId);
      set({ sessionId: freshSessionId });
    }

    get().ensureSession();
    const sessionId = get().sessionId || (typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) || "" : "");

    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      role: "user",
      content: trimmed,
    };

    set((s) => ({
      error: null,
      isSending: true,
      draft: "",
      messages: [...s.messages, userMsg],
    }));

    try {
      const resp: ChatResponse = await chatApi(trimmed, sessionId, language);
      const fitAssessmentContent = buildFitAssessmentResponse(trimmed, resp, language);
      const content = fitAssessmentContent || resp.assistant_message?.trim() || fallbackAssistantMessage(language);
      const assistantMsg: ChatMessage = {
        id: `m_${Date.now() + 1}_${Math.random().toString(16).slice(2)}`,
        role: "assistant",
        content,
        results: resp.results,
        quickActions: resp.quick_actions || undefined,
      };

      set((s) => ({
        isSending: false,
        messages: [...s.messages, assistantMsg],
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      const assistantMsg: ChatMessage = {
        id: `m_${Date.now() + 1}_${Math.random().toString(16).slice(2)}`,
        role: "assistant",
        content: fallbackAssistantMessage(language),
      };
      set((s) => ({ isSending: false, error: msg, messages: [...s.messages, assistantMsg] }));
    }
  },

  seedProductQuestion: (productTitle: string, uiLanguage?: "ro" | "en") => {
    const language = detectUiLanguage(uiLanguage);
    const text =
      language === "ro"
        ? `Spune-mi despre ${productTitle}. Este o alegere bună pentru mine?`
        : `Tell me about ${productTitle}. Is it a good fit for me?`;
    set({ isOpen: true, draft: text });
    void get().sendMessage(text, language, { forceNewTopic: true });
  },
}));
