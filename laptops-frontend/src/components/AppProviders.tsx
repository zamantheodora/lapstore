"use client";

import type { ReactNode } from "react";

import { ConfirmProvider } from "@/context/confirmContext";
import { CartProvider } from "@/context/cartContext";
import { LanguageProvider } from "@/context/languageContext";
import { ToastProvider } from "@/context/toastContext";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ConfirmProvider>
          <CartProvider>{children}</CartProvider>
        </ConfirmProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
