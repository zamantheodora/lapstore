import { create } from "zustand";

type CompareState = {
  ids: number[];
  hydrated: boolean;
  hydrate: () => void;
  toggle: (id: number) => void;
  clear: () => void;
  canAdd: (id: number) => boolean;
};

const STORAGE_KEY = "lapstore-compare-v1";

export const useCompareStore = create<CompareState>((set, get) => ({
  ids: [],
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as number[]) : [];
      set({ ids: Array.isArray(parsed) ? parsed.filter((id) => Number.isFinite(id)).slice(0, 3) : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  toggle: (id: number) => {
    const current = get().ids;
    const exists = current.includes(id);
    let next = current;

    if (exists) {
      next = current.filter((x) => x !== id);
    } else if (current.length < 3) {
      next = [...current, id];
    }

    set({ ids: next });
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  clear: () => {
    set({ ids: [] });
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  canAdd: (id: number) => {
    const current = get().ids;
    return current.includes(id) || current.length < 3;
  },
}));
