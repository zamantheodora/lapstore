"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
};

type ToastContextValue = {
  notify: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneClassName: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-900",
  error: "border-rose-200 bg-rose-50/95 text-rose-900",
  info: "border-blue-200 bg-blue-50/95 text-blue-900",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, description, tone = "info", durationMs = 2600 }: ToastInput) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(92vw,360px)] flex-col gap-2 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto premium-toast rounded-2xl border px-4 py-3 shadow-[0_18px_38px_-26px_rgba(15,23,42,0.68)] backdrop-blur ${toneClassName[toast.tone]}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold leading-5">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-xs opacity-90">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg px-2 py-1 text-xs font-semibold opacity-70 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
