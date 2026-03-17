"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import {
  createEmptyProductForm,
  isProductFormValid,
  mapProductToForm,
  type ProductFormValues,
} from "@/lib/adminProducts";
import type { Product } from "@/lib/types";

type AdminProductModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialProduct?: Product | null;
  onClose: () => void;
  onSave: (values: ProductFormValues) => void;
};

type InputField = {
  key: keyof ProductFormValues;
  label: string;
  type?: "text" | "number";
};

const fields: InputField[] = [
  { key: "title", label: "Title" },
  { key: "brand", label: "Brand" },
  { key: "price", label: "Price (RON)", type: "number" },
  { key: "cpu", label: "CPU" },
  { key: "gpu", label: "GPU" },
  { key: "ram_gb", label: "RAM (GB)", type: "number" },
  { key: "storage_gb", label: "SSD (GB)", type: "number" },
  { key: "refresh_hz", label: "Refresh rate (Hz)", type: "number" },
  { key: "screen_inches", label: "Screen size (inches)", type: "number" },
  { key: "resolution", label: "Resolution" },
  { key: "battery_hours", label: "Battery (hours)", type: "number" },
  { key: "weight_kg", label: "Weight (kg)", type: "number" },
  { key: "os", label: "Operating system" },
];

export default function AdminProductModal({ open, mode, initialProduct, onClose, onSave }: AdminProductModalProps) {
  const [form, setForm] = useState<ProductFormValues>(createEmptyProductForm());

  useEffect(() => {
    if (!open) return;
    setForm(initialProduct ? mapProductToForm(initialProduct) : createEmptyProductForm());
  }, [open, initialProduct]);

  const canSubmit = useMemo(() => isProductFormValid(form), [form]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Admin Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {mode === "create" ? "Add new laptop" : "Edit laptop"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.key} className="text-sm text-slate-700">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</span>
              <input
                type={field.type ?? "text"}
                value={String(form[field.key] ?? "")}
                onChange={(event) => setForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          ))}

          <label className="text-sm text-slate-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value as ProductFormValues["category"] }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="gaming">Gaming</option>
              <option value="school">Student / School</option>
              <option value="ultrabook">Ultrabook / Work</option>
            </select>
          </label>

          <label className="text-sm text-slate-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Product image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = typeof reader.result === "string" ? reader.result : "";
                  if (!dataUrl) return;
                  setForm((prev) => ({ ...prev, imageDataUrl: dataUrl }));
                };
                reader.readAsDataURL(file);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm text-slate-700">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        {form.imageDataUrl ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">Image preview</p>
            <Image
              src={form.imageDataUrl}
              alt="Preview"
              width={320}
              height={180}
              unoptimized
              className="mt-2 h-40 w-auto rounded-lg object-cover"
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSave(form)}
            className="button-glow rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "create" ? "Add laptop" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
