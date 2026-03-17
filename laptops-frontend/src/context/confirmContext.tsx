"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

const defaultState: ConfirmState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  tone: "default",
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(defaultState);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? "Confirm",
      cancelLabel: options.cancelLabel ?? "Cancel",
      tone: options.tone ?? "default",
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {state.open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="premium-panel w-full max-w-md rounded-3xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Confirm action</p>
            <h2 id="confirm-title" className="mt-2 text-xl font-semibold text-slate-900">
              {state.title}
            </h2>
            {state.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{state.description}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {state.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                  state.tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}
