"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { Product } from "@/lib/types";

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  addItem: (product: Product) => void;
  incrementItem: (productId: number) => void;
  decrementItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "lapstore-cart-v1";

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed.filter((entry) => entry?.product?.id && entry.quantity > 0));
      }
    } catch {
      // ignore malformed persisted cart
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing) return [...prev, { product, quantity: 1 }];
      return prev.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const incrementItem = (productId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementItem = (productId: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo<CartContextValue>(() => {
    const cartCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

    return {
      items,
      cartCount,
      subtotal,
      addItem,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}
