import { create } from "zustand";

import type { Product } from "@/lib/types";

export type ShippingDetails = {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type CustomerOrderItem = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: "processing" | "cancelled";
  subtotal: number;
  items: CustomerOrderItem[];
  shipping: ShippingDetails;
};

type CreateOrderInput = {
  items: { product: Product; quantity: number }[];
  subtotal: number;
  shipping: ShippingDetails;
};

type OrdersState = {
  orders: CustomerOrder[];
  hydrated: boolean;
  hydrate: () => void;
  addOrder: (input: CreateOrderInput) => CustomerOrder;
  cancelOrder: (id: string) => void;
  getById: (id: string) => CustomerOrder | undefined;
};

const STORAGE_KEY = "lapstore-orders-v1";

function persistOrders(orders: CustomerOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined" || get().hydrated) return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as CustomerOrder[]) : [];
      set({ orders: Array.isArray(parsed) ? parsed : [], hydrated: true });
    } catch {
      set({ orders: [], hydrated: true });
    }
  },

  addOrder: ({ items, subtotal, shipping }) => {
    const now = Date.now();
    const id = `order_${now}_${Math.floor(Math.random() * 10000)}`;
    const createdAt = new Date(now).toISOString();
    const orderNumber = `LP-${String(now).slice(-8)}`;

    const order: CustomerOrder = {
      id,
      orderNumber,
      createdAt,
      status: "processing",
      subtotal,
      shipping,
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        lineTotal: item.product.price * item.quantity,
      })),
    };

    const nextOrders = [order, ...get().orders];
    set({ orders: nextOrders });
    persistOrders(nextOrders);
    return order;
  },

  cancelOrder: (id: string) => {
    const nextOrders = get().orders.map((order) => {
      if (order.id !== id) return order;
      if (order.status !== "processing") return order;
      return { ...order, status: "cancelled" as const };
    });
    set({ orders: nextOrders });
    persistOrders(nextOrders);
  },

  getById: (id: string) => get().orders.find((order) => order.id === id),
}));
