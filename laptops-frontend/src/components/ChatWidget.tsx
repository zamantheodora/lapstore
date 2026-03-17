"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import { useLanguageContext } from "@/context/languageContext";
import { useChatStore } from "@/store/useChatStore";
import { cn, formatPriceRon } from "@/lib/utils";

export default function ChatWidget() {
  const { language } = useLanguageContext();
  const {
    isOpen,
    isSending,
    error,
    messages,
    toggle,
    close,
    ensureSession,
    sendMessage,
    draft,
    setDraft,
  } = useChatStore();

  const listRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, close]);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);
  const quickPrompts = useMemo(() => {
    if (language === "ro") {
      return [
        "Gaming sub 8000",
        "Laptop de student",
        "Ultrabook sub 7000",
        "Autonomie mare",
        "Raport calitate-preț sub 5000",
      ];
    }

    return [
      "Gaming under 8000",
      "Student laptop",
      "Ultrabook under 7000",
      "Long battery life",
      "Best value under 5000",
    ];
  }, [language]);

  const text =
    language === "ro"
      ? {
          title: "🤖 Asistent AI rapid",
          subtitle: "Întrebări scurte, comparații rapide și analiză de produs",
          promptTitle: "Încearcă una dintre aceste întrebări:",
          topMatches: "Cele mai bune opțiuni",
          inputPlaceholder: "Scrie un mesaj...",
          send: "Trimite",
        }
      : {
          title: "🤖 AI Quick Assistant",
          subtitle: "Fast product Q&A and on-page laptop analysis",
          promptTitle: "Try one of these prompts:",
          topMatches: "Top matches",
          inputPlaceholder: "Type a message...",
          send: "Send",
        };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className={cn(
          "relative z-[61] inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#0b3f91] to-[#1a7ec8] px-5 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-900/30 ring-1 ring-blue-300/35 motion-safe:transition-all motion-safe:duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-blue-900/40",
          !isOpen ? "assistant-attention" : ""
        )}
      >
        <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <svg viewBox="0 0 24 24" aria-hidden="true" className="relative z-10 h-5 w-5" fill="none">
          <rect x="5" y="6.5" width="14" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="10" cy="11.5" r="1.1" fill="currentColor" />
          <circle cx="14" cy="11.5" r="1.1" fill="currentColor" />
          <path d="M9.3 14.8h5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span className="relative z-10">Quick AI</span>
      </button>

      <div
        ref={panelRef}
        className={cn(
          "fixed inset-0 z-[60] flex h-dvh w-screen origin-bottom-right flex-col overflow-hidden rounded-none border border-slate-200 bg-white/95 backdrop-blur-sm motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out will-change-transform will-change-opacity md:inset-auto md:bottom-24 md:right-6 md:h-[520px] md:max-h-[80vh] md:w-[min(92vw,372px)] md:rounded-2xl md:shadow-2xl md:shadow-slate-900/20",
          isOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{text.title}</p>
            <p className="text-xs text-slate-600">{text.subtitle}</p>
          </div>
        </div>

        <div ref={listRef} className="flex-1 space-y-4 overflow-auto bg-slate-50/70 px-4 py-4">
          {!hasMessages ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p>{text.promptTitle}</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isSending}
                    onClick={() => {
                      setDraft(prompt);
                      void sendMessage(prompt, language);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 motion-safe:transition-all motion-safe:duration-200 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[86%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "border-blue-200 bg-blue-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-900"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>

                {m.role === "assistant" && m.results && m.results.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-slate-500">{text.topMatches}</p>
                    <div className="space-y-2">
                      {m.results.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.id}`}
                          className="block rounded-xl border border-slate-200 bg-white p-2 text-left shadow-md motion-safe:transition-all motion-safe:duration-200 hover:bg-blue-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-1 text-xs font-semibold text-slate-900">{p.title}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {p.cpu} · {p.ram_gb}GB · {p.storage_gb}GB
                              </p>
                            </div>
                            <p className="shrink-0 text-xs font-semibold text-slate-900">
                              {formatPriceRon(p.price)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {m.role === "assistant" && m.quickActions && m.quickActions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.quickActions.map((action) => (
                      <button
                        key={`${m.id}_${action.label}`}
                        type="button"
                        disabled={isSending}
                        onClick={() => {
                          setDraft(action.prompt);
                          void sendMessage(action.prompt, language);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 motion-safe:transition-all motion-safe:duration-200 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {error ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-slate-700">
              {error}
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(draft, language);
            setDraft("");
          }}
          className="flex gap-2 border-t border-slate-200 p-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={text.inputPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 motion-safe:transition-all motion-safe:duration-200 focus:border-blue-500 focus:bg-blue-50/40"
          />
          <button
            type="submit"
            disabled={isSending}
            className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white motion-safe:transition-all motion-safe:duration-200 hover:bg-blue-700 disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            <span className="relative z-10">{isSending ? "..." : text.send}</span>
            {isSending ? null : (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="relative z-10 h-3.5 w-3.5" fill="none">
                <path d="M3 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M13 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
