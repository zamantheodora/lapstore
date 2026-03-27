# LapStore Frontend (Next.js)

This README documents only the frontend application in `laptops-frontend`.

For full-stack architecture, backend setup, and repository-level docs, use the root README:
[`../README.md`](../README.md)

---

## Table of Contents

- [Frontend Overview](#frontend-overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Run Frontend Locally](#run-frontend-locally)
- [Environment Variables](#environment-variables)
- [Key UI Features](#key-ui-features)
- [Frontend Scripts](#frontend-scripts)

---

## Frontend Overview

The LapStore frontend is a Next.js App Router application focused on laptop discovery and comparison UX.

It provides:

- fast catalog browsing with filters and sorting,
- product pages with detailed specs,
- compare and recommendation flows,
- a bilingual UI (Romanian / English),
- polished responsive layouts and subtle motion effects.

The frontend consumes product and chat data from the backend API through `NEXT_PUBLIC_API_BASE_URL`.

---

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Zustand** (client state management)
- **Lucide React** (icons)

---

## Folder Structure

```text
laptops-frontend/
├── public/                     # static assets (images, icons)
├── src/
│   ├── app/                    # routes/pages (home, products, compare, wizard, admin)
│   ├── components/             # reusable UI components
│   ├── context/                # providers (language, cart, toast, confirm)
│   ├── i18n/                   # translation dictionaries (en/ro)
│   ├── lib/                    # api client, types, helpers, utils
│   └── store/                  # Zustand stores
├── .env.local                  # local frontend environment vars (not committed)
├── package.json
└── README.md
```

---

## Run Frontend Locally

From project root (`/home/theodora/LapStore`):

```bash
cd laptops-frontend
npm install
npm run dev
```

Open:

- `http://localhost:3000` (or the next available port shown by Next.js)

If port `3000` is occupied, Next.js may run on `3001` automatically.

---

## Environment Variables

Create `laptops-frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend base URL used by frontend API client |

Notes:

- Use `127.0.0.1` (or `localhost`) consistently with your backend CORS config.
- Restart the frontend dev server after changing env values.

---

## Key UI Features

- **Homepage catalog** with filtering, sorting, and smart discovery sections
- **Product detail pages** with specs and review interaction UI
- **Compare flow** for side-by-side product evaluation (up to 3)
- **Laptop Finder wizard** for guided recommendations
- **AI chat widget** for quick recommendation and fit questions
- **Admin dashboard demo UI** (`/admin`) for portfolio presentation
- **Language switch (RO/EN)** with translation dictionaries in `src/i18n`
- **Responsive design** for desktop and mobile

---

## Frontend Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

If you are looking for backend/API setup, deployment architecture, or monorepo-level instructions, go to:
[`../README.md`](../README.md)
