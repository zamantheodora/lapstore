"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AdminProductModal from "@/components/admin/AdminProductModal";
import { listProducts } from "@/lib/api";
import { ADMIN_SESSION_KEY } from "@/lib/adminAuth";
import {
  getNextProductId,
  loadAdminProductsFromStorage,
  loadDeletedProductIdsFromStorage,
  mapFormToProduct,
  type ProductFormValues,
  saveDeletedProductIdsToStorage,
  saveAdminProductsToStorage,
} from "@/lib/adminProducts";
import type { Product } from "@/lib/types";
import { formatPriceRon } from "@/lib/utils";

type ModalState =
  | { open: false }
  | { open: true; mode: "create"; product: null }
  | { open: true; mode: "edit"; product: Product };

type AdminSection = "overview" | "products" | "orders" | "customers" | "inventory" | "analytics";
type PaymentStatus = "Paid" | "Pending" | "Refunded";
type DeliveryStatus = "Delivered" | "Shipped" | "Processing" | "Pending" | "Cancelled";

type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: number;
  payment: PaymentStatus;
  delivery: DeliveryStatus;
  shippingAddress: string;
  notes: string;
  items: Array<{ name: string; qty: number; unitPrice: number }>;
};

type AdminCustomer = {
  name: string;
  email: string;
  orders: number;
  spent: number;
  status: "Active" | "Returning" | "New" | "Top buyer";
};

const adminNav: Array<{ id: AdminSection; label: string; shortLabel: string; description: string; icon: string }> = [
  { id: "overview", label: "Dashboard overview", shortLabel: "Overview", description: "Performance snapshot, activity, and revenue health.", icon: "◈" },
  { id: "products", label: "Products", shortLabel: "Products", description: "Manage catalog, specs, pricing, and stock lifecycle.", icon: "⬚" },
  { id: "orders", label: "Orders", shortLabel: "Orders", description: "Track fulfillment, payment, and delivery status.", icon: "◎" },
  { id: "customers", label: "Customers", shortLabel: "Customers", description: "Inspect customer profile quality and value.", icon: "◉" },
  { id: "inventory", label: "Inventory", shortLabel: "Inventory", description: "Monitor low stock alerts and supplier dependence.", icon: "▣" },
  { id: "analytics", label: "Analytics", shortLabel: "Analytics", description: "Dive deeper into sales and distribution trends.", icon: "◬" },
];

const mockOrders: AdminOrder[] = [
  {
    id: "ORD-2201",
    customer: "Elena Ionescu",
    email: "elena@example.com",
    date: "2026-03-14",
    total: 8599,
    payment: "Paid",
    delivery: "Shipped",
    shippingAddress: "Bd. Unirii 14, Bucuresti",
    notes: "Call before delivery.",
    items: [
      { name: "Lenovo Legion 5 Pro", qty: 1, unitPrice: 7899 },
      { name: "USB-C Dock", qty: 1, unitPrice: 700 },
    ],
  },
  {
    id: "ORD-2202",
    customer: "Mihai Pop",
    email: "mihai@example.com",
    date: "2026-03-14",
    total: 4999,
    payment: "Paid",
    delivery: "Processing",
    shippingAddress: "Str. Sperantei 21, Cluj-Napoca",
    notes: "Gift wrap requested.",
    items: [{ name: "ASUS TUF A15", qty: 1, unitPrice: 4999 }],
  },
  {
    id: "ORD-2203",
    customer: "Andrei Dima",
    email: "andrei@example.com",
    date: "2026-03-13",
    total: 11499,
    payment: "Pending",
    delivery: "Pending",
    shippingAddress: "Str. Florilor 3, Timisoara",
    notes: "Awaiting bank transfer confirmation.",
    items: [
      { name: "Dell XPS 15", qty: 1, unitPrice: 10999 },
      { name: "Wireless Mouse", qty: 1, unitPrice: 500 },
    ],
  },
  {
    id: "ORD-2204",
    customer: "Roxana Pavel",
    email: "roxana@example.com",
    date: "2026-03-13",
    total: 6299,
    payment: "Paid",
    delivery: "Delivered",
    shippingAddress: "Str. Primaverii 45, Iasi",
    notes: "Delivered to reception.",
    items: [{ name: "HP Envy 14", qty: 1, unitPrice: 6299 }],
  },
];

const mockCustomers: AdminCustomer[] = [
  { name: "Elena Ionescu", email: "elena@example.com", orders: 5, spent: 28999, status: "Top buyer" },
  { name: "Mihai Pop", email: "mihai@example.com", orders: 2, spent: 9998, status: "Returning" },
  { name: "Roxana Pavel", email: "roxana@example.com", orders: 4, spent: 22100, status: "Active" },
  { name: "Alex Stan", email: "alex@example.com", orders: 1, spent: 4200, status: "New" },
];

const fallbackBrandPerformance: Array<{ brand: string; count: number }> = [
  { brand: "Lenovo", count: 8 },
  { brand: "ASUS", count: 7 },
  { brand: "Dell", count: 6 },
  { brand: "HP", count: 5 },
  { brand: "Apple", count: 4 },
];

const fallbackCategoryPerformance: Array<{ category: Product["category"]; count: number }> = [
  { category: "gaming", count: 14 },
  { category: "school", count: 11 },
  { category: "ultrabook", count: 9 },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [baseProducts, setBaseProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<number[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Product["category"]>("all");
  const [page, setPage] = useState(1);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [orders, setOrders] = useState<AdminOrder[]>(mockOrders);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<"all" | DeliveryStatus>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customersSearch, setCustomersSearch] = useState("");
  const isOverview = activeSection === "overview";
  const isProducts = activeSection === "products";
  const isOrders = activeSection === "orders";
  const isCustomers = activeSection === "customers";
  const isInventory = activeSection === "inventory";
  const isAnalytics = activeSection === "analytics";

  useEffect(() => {
    const token = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    setAuthorized(true);
    setAdminProducts(loadAdminProductsFromStorage());
    setDeletedProductIds(loadDeletedProductIdsFromStorage());

    let alive = true;
    void (async () => {
      try {
        const products = await listProducts();
        if (!alive) return;
        setBaseProducts(products);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrdersLoading(false);
    }, 420);
    return () => window.clearTimeout(timer);
  }, []);

  const mergedProducts = useMemo(() => {
    const deleted = new Set(deletedProductIds);
    const map = new Map<number, Product>();
    baseProducts.forEach((product) => {
      if (!deleted.has(product.id)) map.set(product.id, product);
    });
    adminProducts.forEach((product) => {
      if (!deleted.has(product.id)) map.set(product.id, product);
    });
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }, [baseProducts, adminProducts, deletedProductIds]);

  const availableBrands = useMemo(
    () => Array.from(new Set(mergedProducts.map((product) => product.brand))).sort((a, b) => a.localeCompare(b)),
    [mergedProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return mergedProducts.filter((product) => {
      const matchesSearch =
        q.length === 0 ||
        product.title.toLowerCase().includes(q) ||
        product.cpu.toLowerCase().includes(q) ||
        product.gpu.toLowerCase().includes(q);
      const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [mergedProducts, searchQuery, brandFilter, categoryFilter]);

  const filteredOrders = useMemo(() => {
    const q = ordersSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        q.length === 0 ||
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q);
      const matchesPayment = paymentFilter === "all" || order.payment === paymentFilter;
      const matchesDelivery = deliveryFilter === "all" || order.delivery === deliveryFilter;
      return matchesQuery && matchesPayment && matchesDelivery;
    });
  }, [orders, ordersSearch, paymentFilter, deliveryFilter]);

  const filteredCustomers = useMemo(() => {
    const q = customersSearch.trim().toLowerCase();
    if (!q) return mockCustomers;
    return mockCustomers.filter((customer) => {
      return customer.name.toLowerCase().includes(q) || customer.email.toLowerCase().includes(q);
    });
  }, [customersSearch]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, brandFilter, categoryFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => {
    const total = mergedProducts.length;
    const avgPrice = total > 0 ? mergedProducts.reduce((acc, item) => acc + item.price, 0) / total : 0;
    const gamingCount = mergedProducts.filter((item) => item.category === "gaming").length;
    const highRefreshCount = mergedProducts.filter((item) => (item.refresh_hz ?? 60) >= 120).length;

    return { total, avgPrice, gamingCount, highRefreshCount };
  }, [mergedProducts]);

  const inventorySummary = useMemo(() => {
    const outOfStock = mergedProducts.filter((item) => item.id % 9 === 0).length;
    const lowStock = mergedProducts.filter((item) => item.id % 9 === 1 || item.id % 9 === 2).length;
    const supplier = mergedProducts.filter((item) => item.id % 9 === 3).length;
    return { outOfStock, lowStock, supplier };
  }, [mergedProducts]);

  const revenue = useMemo(() => orders.reduce((acc, order) => acc + order.total, 0), [orders]);
  const averageOrderValue = useMemo(() => (orders.length > 0 ? revenue / orders.length : 0), [orders, revenue]);

  const brandPerformance = useMemo(() => {
    const counts = new Map<string, number>();
    mergedProducts.forEach((product) => {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    });
    const computed = Array.from(counts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return computed.length > 0 ? computed : fallbackBrandPerformance;
  }, [mergedProducts]);

  const analyticsUsesSampleData = mergedProducts.length === 0;

  const mostViewed = useMemo(() => mergedProducts.slice(0, 5), [mergedProducts]);
  const selectedOrder = useMemo(
    () => (selectedOrderId ? orders.find((order) => order.id === selectedOrderId) ?? null : null),
    [orders, selectedOrderId]
  );
  const deliveryBreakdown = useMemo(
    () =>
      (["Delivered", "Shipped", "Processing", "Pending", "Cancelled"] as DeliveryStatus[]).map((status) => {
        const count = orders.filter((order) => order.delivery === status).length;
        return {
          status,
          count,
          width: orders.length > 0 ? Math.max(8, Math.round((count / orders.length) * 100)) : 0,
        };
      }),
    [orders]
  );

  const revenueTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    orders.forEach((order) => {
      const key = order.date.slice(5, 7);
      monthMap.set(key, (monthMap.get(key) ?? 0) + order.total);
    });
    const fallback = [
      { label: "Nov", value: Math.max(6000, Math.round(revenue * 0.52)) },
      { label: "Dec", value: Math.max(7000, Math.round(revenue * 0.64)) },
      { label: "Jan", value: Math.max(9000, Math.round(revenue * 0.78)) },
      { label: "Feb", value: Math.max(10000, Math.round(revenue * 0.86)) },
      { label: "Mar", value: Math.max(12000, revenue) },
    ];
    const mapped = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, value]) => ({ label: month, value }));
    return mapped.length >= 3 ? mapped.slice(-5) : fallback;
  }, [orders, revenue]);

  const paymentBreakdown = useMemo(
    () =>
      (["Paid", "Pending", "Refunded"] as PaymentStatus[]).map((status) => {
        const count = orders.filter((order) => order.payment === status).length;
        return {
          status,
          count,
          width: orders.length > 0 ? Math.max(8, Math.round((count / orders.length) * 100)) : 0,
        };
      }),
    [orders]
  );

  const categoryPerformance = useMemo(
    () => {
      const normalizeCategory = (category: string): Product["category"] => {
        if (category === "student") return "school";
        if (category === "work") return "ultrabook";
        return category as Product["category"];
      };

      const categories = ["gaming", "school", "ultrabook"] as Product["category"][];
      const counts = categories.map((category) => {
        const count = mergedProducts.filter((product) => normalizeCategory(String(product.category)) === category).length;
        return { category, count };
      });

      const totalCount = counts.reduce((sum, entry) => sum + entry.count, 0);
      const source = totalCount > 0 ? counts : fallbackCategoryPerformance;
      const sourceTotal = source.reduce((sum, entry) => sum + entry.count, 0);

      return source.map((entry) => ({
        ...entry,
        width: sourceTotal > 0 ? Math.max(10, Math.round((entry.count / sourceTotal) * 100)) : 0,
      }));
    },
    [mergedProducts]
  );

  function getStockLabelByProduct(product: Product): "Low" | "Out" | "Healthy" {
    if (product.id % 9 === 0) return "Out";
    if (product.id % 9 === 1 || product.id % 9 === 2) return "Low";
    return "Healthy";
  }

  function getPaymentBadgeClass(status: PaymentStatus) {
    if (status === "Paid") return "border-emerald-300 bg-emerald-100 text-emerald-800";
    if (status === "Refunded") return "border-violet-300 bg-violet-100 text-violet-800";
    return "border-amber-300 bg-amber-100 text-amber-800";
  }

  function getDeliveryBadgeClass(status: DeliveryStatus) {
    if (status === "Delivered") return "border-emerald-300 bg-emerald-100 text-emerald-800";
    if (status === "Shipped") return "border-sky-300 bg-sky-100 text-sky-800";
    if (status === "Processing") return "border-indigo-300 bg-indigo-100 text-indigo-800";
    if (status === "Cancelled") return "border-rose-300 bg-rose-100 text-rose-800";
    return "border-amber-300 bg-amber-100 text-amber-800";
  }

  function getCustomerBadgeClass(status: AdminCustomer["status"]) {
    if (status === "Top buyer") return "border-violet-300 bg-violet-100 text-violet-800";
    if (status === "Active") return "border-emerald-300 bg-emerald-100 text-emerald-800";
    if (status === "Returning") return "border-blue-300 bg-blue-100 text-blue-800";
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  function updateOrderStatus(orderId: string, patch: Partial<Pick<AdminOrder, "payment" | "delivery">>) {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        return { ...order, ...patch };
      })
    );
  }

  function exportCsv(filename: string, rows: Record<string, string | number>[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (value: string | number) => {
      const text = String(value);
      if (text.includes(",") || text.includes("\n") || text.includes('"')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportProductsCsv() {
    const rows = filteredProducts.map((product) => ({
      id: product.id,
      title: product.title,
      brand: product.brand,
      category: product.category,
      price: product.price,
      ram_gb: product.ram_gb,
      storage_gb: product.storage_gb,
      stock: getStockLabelByProduct(product),
    }));
    exportCsv("lapstore-products.csv", rows);
  }

  function exportOrdersCsv() {
    const rows = filteredOrders.map((order) => ({
      id: order.id,
      customer: order.customer,
      email: order.email,
      date: order.date,
      total: order.total,
      payment: order.payment,
      delivery: order.delivery,
    }));
    exportCsv("lapstore-orders.csv", rows);
  }

  function persistAndSet(nextProducts: Product[]) {
    setAdminProducts(nextProducts);
    saveAdminProductsToStorage(nextProducts);
  }

  function persistDeletedIds(nextIds: number[]) {
    setDeletedProductIds(nextIds);
    saveDeletedProductIdsToStorage(nextIds);
  }

  function handleSave(values: ProductFormValues) {
    if (modalState.open && modalState.mode === "edit") {
      const updated = mapFormToProduct(values, modalState.product.id);
      persistAndSet(adminProducts.map((product) => (product.id === updated.id ? updated : product)));
      persistDeletedIds(deletedProductIds.filter((id) => id !== updated.id));
      setModalState({ open: false });
      return;
    }

    const nextId = getNextProductId(mergedProducts);
    const created = mapFormToProduct(values, nextId);
    persistAndSet([...adminProducts, created]);
    persistDeletedIds(deletedProductIds.filter((id) => id !== created.id));
    setModalState({ open: false });
  }

  function handleDelete(productId: number) {
    if (!window.confirm("Delete this laptop from admin catalog?")) return;
    persistAndSet(adminProducts.filter((product) => product.id !== productId));
    if (!deletedProductIds.includes(productId)) {
      persistDeletedIds([...deletedProductIds, productId]);
    }
  }

  if (!authorized) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Redirecting to admin login...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-6 h-fit rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0b1224] via-[#0f1a35] to-[#0b1224] p-4 text-slate-200 shadow-[0_30px_65px_-42px_rgba(2,6,23,0.9)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/90">LapStore Admin</p>
            <p className="mt-2 text-sm font-semibold text-white">Control Center</p>
            <p className="mt-1 text-xs text-slate-300">Operations, analytics, inventory, and customer lifecycle.</p>
          </div>

          <nav className="mt-4 space-y-1.5">
            {adminNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  activeSection === item.id
                    ? "border-cyan-300/40 bg-cyan-400/15 text-white shadow-[0_10px_26px_-18px_rgba(34,211,238,0.9)]"
                    : "border-white/5 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-sm">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{item.shortLabel}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-300">{item.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </nav>

          <div className="mt-4 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(ADMIN_SESSION_KEY);
                router.push("/admin/login");
              }}
              className="w-full rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="space-y-4">
          <header className="rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore Admin</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
                  {adminNav.find((item) => item.id === activeSection)?.label}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
                  {adminNav.find((item) => item.id === activeSection)?.description}
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                <label className="relative min-w-[220px] flex-1 sm:flex-none">
                  <span className="sr-only">Search admin</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search products, orders..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
                >
                  🔔
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">AD</span>
                  Admin
                </button>
              </div>
            </div>

            {isProducts ? (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setModalState({ open: true, mode: "create", product: null })}
                  className="button-glow rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-cyan-400"
                >
                  Add new laptop
                </button>
              </div>
            ) : null}
          </header>

          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_22px_52px_-42px_rgba(15,23,42,0.6)] sm:p-5">
            {isOverview ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total laptops", value: stats.total, tone: "from-slate-900 to-slate-700", note: `+${stats.gamingCount} gaming` },
                    { label: "Total sales", value: formatPriceRon(revenue), tone: "from-blue-700 to-cyan-500", note: `${orders.length} orders` },
                    { label: "Average order", value: formatPriceRon(Math.round(averageOrderValue)), tone: "from-indigo-700 to-blue-500", note: `${mockCustomers.length} active buyers` },
                    { label: "High refresh", value: stats.highRefreshCount, tone: "from-emerald-700 to-teal-500", note: `${inventorySummary.lowStock} low stock` },
                  ].map((stat) => (
                    <article key={stat.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className={`h-1.5 bg-gradient-to-r ${stat.tone}`} />
                      <div className="p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                        <p className="mt-1 text-xs text-slate-500">{stat.note}</p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Revenue trend</h2>
                      <span className="text-xs text-slate-300">Last 5 periods</span>
                    </div>
                    <div className="mt-4 h-36 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      {(() => {
                        const max = Math.max(...revenueTrend.map((point) => point.value), 1);
                        const points = revenueTrend
                          .map((point, index) => {
                            const x = (index / Math.max(1, revenueTrend.length - 1)) * 100;
                            const y = 90 - (point.value / max) * 80;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                            <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        );
                      })()}
                    </div>
                    <div className="mt-3 grid grid-cols-5 gap-1 text-[10px] text-slate-300">
                      {revenueTrend.map((point) => (
                        <span key={point.label} className="text-center">{point.label}</span>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-900">Delivery pipeline</h2>
                    <div className="mt-3 space-y-3">
                      {deliveryBreakdown.map((entry) => (
                        <div key={entry.status}>
                          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
                            <span>{entry.status}</span>
                            <span>{entry.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${entry.width}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
                  <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <h3 className="text-sm font-semibold text-slate-900">Recent orders</h3>
                      <button type="button" onClick={() => setActiveSection("orders")} className="text-xs font-semibold text-blue-700 hover:text-blue-600">
                        Open orders
                      </button>
                    </div>
                    <div className="overflow-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-2.5">Order</th>
                            <th className="px-4 py-2.5">Customer</th>
                            <th className="px-4 py-2.5">Total</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 4).map((order) => (
                            <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-semibold text-slate-900">{order.id}</td>
                              <td className="px-4 py-2.5 text-slate-700">{order.customer}</td>
                              <td className="px-4 py-2.5 font-semibold text-slate-900">{formatPriceRon(order.total)}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${getDeliveryBadgeClass(order.delivery)}`}>
                                  {order.delivery}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Inventory alerts</h3>
                    <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                      <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">Low stock warnings: {inventorySummary.lowStock}</li>
                      <li className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">Out of stock items: {inventorySummary.outOfStock}</li>
                      <li className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">Supplier dependent products: {inventorySummary.supplier}</li>
                      <li className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Most viewed: {mostViewed[0]?.title ?? "n/a"}</li>
                    </ul>
                  </article>
                </div>
              </>
            ) : null}

            {isProducts ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by title, CPU, GPU"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>

                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Brand</span>
                    <select
                      value={brandFilter}
                      onChange={(event) => setBrandFilter(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    >
                      <option value="all">All brands</option>
                      {availableBrands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value as "all" | Product["category"])}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    >
                      <option value="all">All categories</option>
                      <option value="gaming">Gaming</option>
                      <option value="school">School</option>
                      <option value="ultrabook">Ultrabook</option>
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={exportProductsCsv}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_38px_-30px_rgba(15,23,42,0.5)]">
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-900 text-[11px] uppercase tracking-[0.12em] text-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Laptop</th>
                          <th className="px-4 py-3 font-semibold">Brand</th>
                          <th className="px-4 py-3 font-semibold">Price</th>
                          <th className="px-4 py-3 font-semibold">RAM / SSD</th>
                          <th className="px-4 py-3 font-semibold">Refresh</th>
                          <th className="px-4 py-3 font-semibold">Stock</th>
                          <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                              Loading products...
                            </td>
                          </tr>
                        ) : null}

                        {!isLoading && filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-sm text-slate-500">
                              No products found for current filters.
                            </td>
                          </tr>
                        ) : null}

                        {paginatedProducts.map((product) => (
                          <tr key={product.id} className="border-t border-slate-100 text-slate-700 transition hover:bg-blue-50/40">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">{product.title}</p>
                                <p className="text-xs text-slate-500">#{product.id}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">{product.brand}</td>
                            <td className="px-4 py-3 font-semibold text-blue-700">{formatPriceRon(product.price)}</td>
                            <td className="px-4 py-3">{product.ram_gb}GB / {product.storage_gb}GB</td>
                            <td className="px-4 py-3">{product.refresh_hz ?? 60}Hz</td>
                            <td className="px-4 py-3">
                              {getStockLabelByProduct(product) === "Out" ? (
                                <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Out</span>
                              ) : null}
                              {getStockLabelByProduct(product) === "Low" ? (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Low</span>
                              ) : null}
                              {getStockLabelByProduct(product) === "Healthy" ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Healthy</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setModalState({ open: true, mode: "edit", product })}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(product.id)}
                                  className="rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <p>
                    Showing {(safePage - 1) * pageSize + (filteredProducts.length ? 1 : 0)}-
                    {Math.min(safePage * pageSize, filteredProducts.length)} of {filteredProducts.length} products.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Page {safePage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>

                  <Link href="/" className="font-semibold text-blue-700 hover:text-blue-600">
                    View storefront →
                  </Link>
                </div>
              </div>
            ) : null}

            {isOrders ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-5">
                  <label className="text-sm text-slate-700 md:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search orders</span>
                    <input
                      value={ordersSearch}
                      onChange={(event) => setOrdersSearch(event.target.value)}
                      placeholder="Order ID, customer, email"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>

                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</span>
                    <select
                      value={paymentFilter}
                      onChange={(event) => setPaymentFilter(event.target.value as "all" | PaymentStatus)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </label>

                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery</span>
                    <select
                      value={deliveryFilter}
                      onChange={(event) => setDeliveryFilter(event.target.value as "all" | DeliveryStatus)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </label>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={exportOrdersCsv}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_38px_-30px_rgba(15,23,42,0.5)]">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-900 text-[11px] uppercase tracking-[0.12em] text-slate-200">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Delivery</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Loading orders...</td>
                        </tr>
                      ) : null}

                      {!ordersLoading && filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No orders match current filters.</td>
                        </tr>
                      ) : null}

                      {!ordersLoading
                        ? filteredOrders.map((order) => (
                            <tr key={order.id} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                              <td className="px-4 py-3 font-semibold text-slate-900">{order.id}</td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-900">{order.customer}</p>
                                <p className="text-xs text-slate-500">{order.email}</p>
                              </td>
                              <td className="px-4 py-3">{order.date}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatPriceRon(order.total)}</td>
                              <td className="px-4 py-3">
                                <div className="mb-1">
                                  <span className={`inline-flex min-w-[84px] justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPaymentBadgeClass(order.payment)}`}>
                                    {order.payment}
                                  </span>
                                </div>
                                <select
                                  value={order.payment}
                                  onChange={(event) => updateOrderStatus(order.id, { payment: event.target.value as PaymentStatus })}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                                >
                                  <option value="Paid">Paid</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Refunded">Refunded</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <div className="mb-1">
                                  <span className={`inline-flex min-w-[84px] justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getDeliveryBadgeClass(order.delivery)}`}>
                                    {order.delivery}
                                  </span>
                                </div>
                                <select
                                  value={order.delivery}
                                  onChange={(event) => updateOrderStatus(order.id, { delivery: event.target.value as DeliveryStatus })}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderId(order.id)}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  View details
                                </button>
                              </td>
                            </tr>
                          ))
                        : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {isCustomers ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <label className="text-sm text-slate-700">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search customers</span>
                    <input
                      value={customersSearch}
                      onChange={(event) => setCustomersSearch(event.target.value)}
                      placeholder="Customer name or email"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_38px_-30px_rgba(15,23,42,0.5)]">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-900 text-[11px] uppercase tracking-[0.12em] text-slate-200">
                      <tr>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Orders</th>
                        <th className="px-4 py-3">Total spent</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No customers found.</td>
                        </tr>
                      ) : null}

                      {filteredCustomers.map((customer) => (
                        <tr key={customer.email} className="border-t border-slate-100 transition hover:bg-blue-50/40">
                          <td className="px-4 py-3 font-semibold text-slate-900">{customer.name}</td>
                          <td className="px-4 py-3">{customer.email}</td>
                          <td className="px-4 py-3">{customer.orders}</td>
                          <td className="px-4 py-3">{formatPriceRon(customer.spent)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCustomerBadgeClass(customer.status)}`}
                            >
                              {customer.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {isInventory ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Stock count</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p>
                  </article>
                  <article className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-700">Low stock warnings</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-900">{inventorySummary.lowStock}</p>
                  </article>
                  <article className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4">
                    <p className="text-xs uppercase tracking-wide text-rose-700">Out of stock</p>
                    <p className="mt-2 text-2xl font-semibold text-rose-900">{inventorySummary.outOfStock}</p>
                  </article>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Supplier dependency</h3>
                    <p className="mt-2 text-sm text-slate-600">{inventorySummary.supplier} products currently depend on supplier stock.</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Top watched laptops</h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                      {mostViewed.map((item) => (
                        <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
                          <span className="truncate pr-2">{item.title}</span>
                          <span className="text-xs text-slate-500">{item.brand}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </div>
            ) : null}

            {isAnalytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total sales</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPriceRon(revenue)}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total orders</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{orders.length}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">AOV</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPriceRon(Math.round(averageOrderValue))}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Avg listing price</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPriceRon(Math.round(stats.avgPrice))}</p>
                  </article>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-slate-900">Brand portfolio mix</h2>
                      {analyticsUsesSampleData ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Sample data</span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex h-48 items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      {brandPerformance.map((brand) => {
                        const height = Math.max(18, brand.count * 16);
                        return (
                          <div key={brand.brand} className="flex flex-1 flex-col items-center gap-2">
                            <div className="w-full rounded-md bg-gradient-to-t from-blue-700 to-cyan-500" style={{ height }} />
                            <p className="text-[11px] font-semibold text-slate-600">{brand.brand}</p>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                    <h2 className="text-sm font-semibold">Revenue trendline</h2>
                    <div className="mt-4 h-48 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      {(() => {
                        const max = Math.max(...revenueTrend.map((point) => point.value), 1);
                        const points = revenueTrend
                          .map((point, index) => {
                            const x = (index / Math.max(1, revenueTrend.length - 1)) * 100;
                            const y = 90 - (point.value / max) * 80;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                            <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
                          </svg>
                        );
                      })()}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-900">Orders by payment status</h2>
                    <div className="mt-4 space-y-3">
                      {paymentBreakdown.map((entry) => (
                        <div key={entry.status}>
                          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
                            <span>{entry.status}</span>
                            <span>{entry.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500" style={{ width: `${entry.width}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Category performance</h3>
                    <div className="mt-3 space-y-2.5">
                      {categoryPerformance.map((entry) => (
                        <div key={entry.category}>
                          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600">
                            <span className="capitalize">{entry.category}</span>
                            <span>{entry.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-500" style={{ width: `${entry.width}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700/60 bg-[#0f172a] p-6 text-slate-100 shadow-[0_34px_70px_-42px_rgba(2,6,23,0.96)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Order details</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedOrder.id}</h3>
                <p className="mt-1 text-sm text-slate-300">{selectedOrder.customer} · {selectedOrder.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Date</p>
                <p className="mt-1 font-semibold text-slate-100">{selectedOrder.date}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total</p>
                <p className="mt-1 font-semibold text-slate-100">{formatPriceRon(selectedOrder.total)}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Payment</p>
                <p className="mt-1 font-semibold text-slate-100">{selectedOrder.payment}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Delivery</p>
                <p className="mt-1 font-semibold text-slate-100">{selectedOrder.delivery}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400">Shipping address</p>
              <p className="mt-1 text-slate-200">{selectedOrder.shippingAddress}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order items</p>
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-700">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item) => (
                      <tr key={item.name} className="border-t border-slate-800">
                        <td className="px-3 py-2 text-slate-200">{item.name}</td>
                        <td className="px-3 py-2 text-slate-300">{item.qty}</td>
                        <td className="px-3 py-2 text-slate-300">{formatPriceRon(item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-cyan-900/60 bg-cyan-950/30 p-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-wide text-cyan-300">Notes</p>
              <p className="mt-1">{selectedOrder.notes}</p>
            </div>
          </div>
        </div>
      ) : null}

      <AdminProductModal
        open={modalState.open}
        mode={modalState.open ? modalState.mode : "create"}
        initialProduct={modalState.open && modalState.mode === "edit" ? modalState.product : null}
        onClose={() => setModalState({ open: false })}
        onSave={handleSave}
      />
    </div>
  );
}
