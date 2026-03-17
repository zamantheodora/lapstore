"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

import { useLanguageContext } from "@/context/languageContext";
import { hasUserSession } from "@/lib/userAuth";
import { useOrdersStore } from "@/store/useOrdersStore";
import { useWishlistStore } from "@/store/useWishlistStore";

type SavedAddress = {
  id: string;
  isDefault: boolean;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
};

type AddressForm = Omit<SavedAddress, "id" | "isDefault">;

type ProfileDetails = {
  name: string;
  email: string;
  phone: string;
};

const SAVED_ADDRESS_STORAGE_KEY = "lapstore-account-saved-address-v2";
const LEGACY_SAVED_ADDRESS_STORAGE_KEY = "lapstore-account-saved-address-v1";
const PROFILE_STORAGE_KEY = "lapstore-account-profile-v1";

const DEFAULT_ADDRESS_FORM: AddressForm = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Romania",
};

const DEFAULT_PROFILE: ProfileDetails = {
  name: "Alex Popescu",
  email: "alex.popescu@example.com",
  phone: "+40 721 000 000",
};

export default function AccountPage() {
  const { t } = useLanguageContext();
  const { orders, hydrate: hydrateOrders } = useOrdersStore();
  const { ids, hydrate: hydrateWishlist } = useWishlistStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<ProfileDetails>(DEFAULT_PROFILE);
  const [profileForm, setProfileForm] = useState<ProfileDetails>(DEFAULT_PROFILE);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [pendingDeleteAddressId, setPendingDeleteAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(DEFAULT_ADDRESS_FORM);
  const hasAutoSeededAddress = useRef(false);
  const hasSavedAddressStorageRecord = useRef(false);

  useEffect(() => {
    hydrateOrders();
    hydrateWishlist();
  }, [hydrateOrders, hydrateWishlist]);

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(hasUserSession());
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const latestOrder = useMemo(() => orders[0], [orders]);
  const latestOrderAddress = useMemo<AddressForm | null>(() => {
    if (!latestOrder) return null;
    return {
      fullName: latestOrder.shipping.fullName,
      phone: latestOrder.shipping.phone,
      address: latestOrder.shipping.address,
      city: latestOrder.shipping.city,
      postalCode: latestOrder.shipping.postalCode,
      country: latestOrder.shipping.country,
    };
  }, [latestOrder]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (rawProfile) {
        const parsedProfile = JSON.parse(rawProfile) as ProfileDetails;
        if (parsedProfile && typeof parsedProfile === "object") {
          const nextProfile = {
            name: parsedProfile.name || DEFAULT_PROFILE.name,
            email: parsedProfile.email || DEFAULT_PROFILE.email,
            phone: parsedProfile.phone || DEFAULT_PROFILE.phone,
          };
          setProfile(nextProfile);
          setProfileForm(nextProfile);
        }
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
      setProfileForm(DEFAULT_PROFILE);
    }

    try {
      const raw = window.localStorage.getItem(SAVED_ADDRESS_STORAGE_KEY);
      if (raw) {
        hasSavedAddressStorageRecord.current = true;
        const parsed = JSON.parse(raw) as SavedAddress[];
        if (Array.isArray(parsed)) {
          setSavedAddresses(
            parsed
              .filter((entry) => entry && typeof entry === "object" && typeof entry.fullName === "string")
              .map((entry, index) => ({
                ...entry,
                id: entry.id || `addr_${Date.now()}_${index}`,
                isDefault: Boolean(entry.isDefault),
              }))
          );
          return;
        }
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_SAVED_ADDRESS_STORAGE_KEY);
      if (!legacyRaw) return;
      hasSavedAddressStorageRecord.current = true;
      const legacy = JSON.parse(legacyRaw) as AddressForm;
      if (!legacy || typeof legacy !== "object") return;
      setSavedAddresses([
        {
          id: `addr_${Date.now()}`,
          isDefault: true,
          fullName: legacy.fullName,
          phone: legacy.phone,
          address: legacy.address,
          city: legacy.city,
          postalCode: legacy.postalCode,
          country: legacy.country,
        },
      ]);
    } catch {
      setSavedAddresses([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSavedAddressStorageRecord.current) return;
    if (hasAutoSeededAddress.current) return;
    if (savedAddresses.length > 0) {
      hasAutoSeededAddress.current = true;
      return;
    }
    if (!latestOrderAddress) return;

    const seeded: SavedAddress = {
      id: `addr_${Date.now()}`,
      isDefault: true,
      ...latestOrderAddress,
    };
    setSavedAddresses([seeded]);
    window.localStorage.setItem(SAVED_ADDRESS_STORAGE_KEY, JSON.stringify([seeded]));
    hasSavedAddressStorageRecord.current = true;
    hasAutoSeededAddress.current = true;
  }, [latestOrderAddress, savedAddresses.length]);

  const defaultAddress = useMemo(
    () => savedAddresses.find((entry) => entry.isDefault) || savedAddresses[0] || null,
    [savedAddresses]
  );

  const openAddressModal = (address?: SavedAddress) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm(defaultAddress ?? latestOrderAddress ?? DEFAULT_ADDRESS_FORM);
    }
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddressId(null);
  };

  const secondaryButtonClass = "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100";

  const persistAddresses = (nextAddresses: SavedAddress[]) => {
    setSavedAddresses(nextAddresses);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SAVED_ADDRESS_STORAGE_KEY, JSON.stringify(nextAddresses));
      hasSavedAddressStorageRecord.current = true;
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextProfile: ProfileDetails = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      phone: profileForm.phone.trim(),
    };
    setProfile(nextProfile);
    setProfileForm(nextProfile);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    }
    setIsEditingProfile(false);
  };

  const cancelProfileEdit = () => {
    setProfileForm(profile);
    setIsEditingProfile(false);
  };

  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextAddressForm: AddressForm = {
      fullName: addressForm.fullName.trim(),
      phone: addressForm.phone.trim(),
      address: addressForm.address.trim(),
      city: addressForm.city.trim(),
      postalCode: addressForm.postalCode.trim(),
      country: addressForm.country.trim(),
    };

    const nextAddresses =
      editingAddressId !== null
        ? savedAddresses.map((entry) =>
            entry.id === editingAddressId
              ? {
                  ...entry,
                  ...nextAddressForm,
                }
              : entry
          )
        : [
            {
              id: `addr_${Date.now()}`,
              isDefault: savedAddresses.length === 0,
              ...nextAddressForm,
            },
            ...savedAddresses,
          ];

    const normalizedAddresses = nextAddresses.some((entry) => entry.isDefault)
      ? nextAddresses
      : nextAddresses.map((entry, index) => ({ ...entry, isDefault: index === 0 }));

    persistAddresses(normalizedAddresses);
    setIsAddressModalOpen(false);
    setEditingAddressId(null);
  };

  const requestDeleteAddress = (id: string) => {
    setPendingDeleteAddressId(id);
  };

  const closeDeleteAddressModal = () => {
    setPendingDeleteAddressId(null);
  };

  const confirmDeleteAddress = () => {
    if (!pendingDeleteAddressId) return;

    const nextAddresses = savedAddresses.filter((entry) => entry.id !== pendingDeleteAddressId);
    const normalizedAddresses =
      nextAddresses.length > 0 && !nextAddresses.some((entry) => entry.isDefault)
        ? nextAddresses.map((entry, index) => ({ ...entry, isDefault: index === 0 }))
        : nextAddresses;
    persistAddresses(normalizedAddresses);
    setPendingDeleteAddressId(null);
  };

  const setDefaultAddress = (id: string) => {
    const nextAddresses = savedAddresses.map((entry) => ({
      ...entry,
      isDefault: entry.id === id,
    }));
    persistAddresses(nextAddresses);
  };

  const startProfileEdit = () => {
    setProfileForm(profile);
    setIsEditingProfile(true);
  };

  const orderedAddresses = useMemo(() => {
    return [...savedAddresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }, [savedAddresses]);

  const renderAddressCard = (address: SavedAddress) => {
    return (
      <div key={address.id} className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {address.isDefault ? t("account.defaultAddress") : "Saved address"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!address.isDefault ? (
              <button
                type="button"
                onClick={() => setDefaultAddress(address.id)}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Set default
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openAddressModal(address)}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => requestDeleteAddress(address.id)}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Delete
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-900">{address.fullName}</p>
        <p className="text-sm text-slate-600">{address.address}</p>
        <p className="text-sm text-slate-600">
          {address.city} {address.postalCode}
        </p>
        <p className="text-sm text-slate-600">{address.country}</p>
        <p className="mt-1 text-sm text-slate-600">{address.phone}</p>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section className="premium-panel rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
          <h1 className="mt-2 section-title text-slate-900">{t("account.title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("account.subtitle")}</p>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Please log in to access your account</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to manage your profile, addresses, orders, and wishlist.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <section className="premium-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">LapStore</p>
        <h1 className="mt-2 section-title text-slate-900">{t("account.title")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("account.subtitle")}</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100/70 bg-gradient-to-br from-[#071126] via-[#0a2452] to-[#0b5fff] p-5 text-white shadow-[0_24px_60px_-34px_rgba(8,20,43,0.75)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/90">Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {profile.name.split(" ")[0]} 👋</h2>
          <p className="mt-2 text-sm text-blue-100/90">Manage your profile, orders and saved laptops</p>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50/85 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4.5 w-4.5 text-blue-700">
                  <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M5.5 19a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span>{t("account.profileDetails")}</span>
              </h2>
              {!isEditingProfile ? (
                <button type="button" onClick={startProfileEdit} className={secondaryButtonClass}>
                  ✏️ Edit profile
                </button>
              ) : null}
            </div>

            {!isEditingProfile ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">{t("account.profileNameLabel")}</dt>
                  <dd className="font-semibold text-slate-900">{profile.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">{t("account.profileEmailLabel")}</dt>
                  <dd className="font-semibold text-slate-900">{profile.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">{t("account.profilePhoneLabel")}</dt>
                  <dd className="font-semibold text-slate-900">{profile.phone}</dd>
                </div>
              </dl>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={saveProfile}>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={cancelProfileEdit} className={secondaryButtonClass}>
                    Cancel
                  </button>
                  <button type="submit" className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
                    Save
                  </button>
                </div>
              </form>
            )}
          </article>

          <article className="premium-soft-panel rounded-2xl border border-slate-200/90 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4.5 w-4.5 text-blue-700">
                  <path d="M12 21s6-6.2 6-11a6 6 0 1 0-12 0c0 4.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span>{t("account.savedAddresses")}</span>
              </h2>
              <button
                type="button"
                onClick={() => openAddressModal()}
                className={secondaryButtonClass}
              >
                <span aria-hidden="true" className="mr-1">📍</span>
                <span>Add address</span>
              </button>
            </div>

            {orderedAddresses.length > 0 ? (
              <div>
                {orderedAddresses.map((entry) => renderAddressCard(entry))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">No saved addresses yet. Add one for faster checkout.</p>
            )}
          </article>

          <article className="premium-soft-panel rounded-2xl border border-slate-200/90 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                  <path d="M7 8h10v10H7z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 8V6h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t("account.orders")}</h2>
                <p className="text-xs text-slate-500">Dashboard stat</p>
              </div>
            </div>
            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{orders.length}</p>
            <p className="mt-1 text-sm text-slate-600">{t("account.ordersCount").replace("{count}", String(orders.length))}</p>
            <Link
              href="/account/orders"
              className={`mt-4 ${secondaryButtonClass}`}
            >
              <span aria-hidden="true" className="mr-1">📦</span>
              <span>{t("account.manageOrders")}</span>
            </Link>
          </article>

          <article className="premium-soft-panel rounded-2xl border border-slate-200/90 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                  <path d="M12 20.5 4.8 13.3a4.7 4.7 0 0 1 0-6.6 4.7 4.7 0 0 1 6.6 0L12 7.2l.6-.5a4.7 4.7 0 0 1 6.6 6.6L12 20.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t("account.wishlist")}</h2>
                <p className="text-xs text-slate-500">Dashboard stat</p>
              </div>
            </div>
            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{ids.length}</p>
            <p className="mt-1 text-sm text-slate-600">{t("account.wishlistCount").replace("{count}", String(ids.length))}</p>
            <Link
              href="/account/wishlist"
              className={`mt-4 ${secondaryButtonClass}`}
            >
              <span aria-hidden="true" className="mr-1">❤️</span>
              <span>{t("account.manageWishlist")}</span>
            </Link>
          </article>
          </div>
        </div>
      </section>

      {isAddressModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.65)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">{editingAddressId ? "Edit address" : "Add address"}</h2>
              <button
                type="button"
                onClick={closeAddressModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close add address modal"
              >
                ×
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={saveAddress}>
              <input
                type="text"
                required
                placeholder="Full name"
                value={addressForm.fullName}
                onChange={(event) => setAddressForm((current) => ({ ...current, fullName: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="tel"
                required
                placeholder="Phone"
                value={addressForm.phone}
                onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <input
                type="text"
                required
                placeholder="Address line"
                value={addressForm.address}
                onChange={(event) => setAddressForm((current) => ({ ...current, address: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <input
                  type="text"
                  required
                  placeholder="Postal code"
                  value={addressForm.postalCode}
                  onChange={(event) => setAddressForm((current) => ({ ...current, postalCode: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Country"
                value={addressForm.country}
                onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  {editingAddressId ? "Save changes" : "Save address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingDeleteAddressId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.65)]">
            <h2 className="text-base font-semibold text-slate-900">Delete address</h2>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to remove this saved address?</p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteAddressModal}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAddress}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
