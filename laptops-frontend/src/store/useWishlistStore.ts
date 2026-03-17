import { create } from "zustand";

import { hasUserSession } from "@/lib/userAuth";

type WishlistState = {
  ids: number[];
  hydrated: boolean;
  hydrate: () => void;
  clear: () => void;
  toggle: (id: number) => void;
  has: (id: number) => boolean;
};

const STORAGE_KEY = "lapstore-wishlist-v1";

function clearWishlistStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;

    if (!hasUserSession()) {
      clearWishlistStorage();
      set({ ids: [], hydrated: true });
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as number[];
      set({ ids: Array.isArray(parsed) ? parsed.filter((id) => Number.isFinite(id)) : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  clear: () => {
    clearWishlistStorage();
    set({ ids: [] });
  },

  toggle: (id: number) => {
    if (!hasUserSession()) {
      clearWishlistStorage();
      set({ ids: [] });
      return;
    }

    const exists = get().ids.includes(id);
    const next = exists ? get().ids.filter((x) => x !== id) : [...get().ids, id];
    set({ ids: next });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  },

  has: (id: number) => get().ids.includes(id),
}));
