import { create } from "zustand";

type RecentlyViewedState = {
  ids: number[];
  hydrated: boolean;
  hydrate: () => void;
  pushViewed: (id: number) => void;
};

const STORAGE_KEY = "lapstore-recently-viewed-v1";

export const useRecentlyViewedStore = create<RecentlyViewedState>((set, get) => ({
  ids: [],
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as number[]) : [];
      set({ ids: Array.isArray(parsed) ? parsed.filter((id) => Number.isFinite(id)).slice(0, 12) : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  pushViewed: (id: number) => {
    const deduped = [id, ...get().ids.filter((x) => x !== id)].slice(0, 12);
    set({ ids: deduped });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    }
  },
}));
