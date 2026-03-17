# LapStore – AI Laptop Finder (Full Stack)

LapStore is a full-stack laptop discovery platform with a modern **Next.js frontend** and a **FastAPI + MySQL backend**.
It helps users explore, compare, and evaluate laptops using practical filters, guided recommendations, and an AI-assisted chat flow.

---

## Table of Contents

- [Project Description](#project-description)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Admin Dashboard Overview](#admin-dashboard-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Run Full Stack Locally)](#quick-start-run-full-stack-locally)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Usage Guide](#usage-guide)
- [Screenshots](#screenshots)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Project Description

LapStore is designed to reduce decision fatigue when buying a laptop.

Users can:

- browse a curated catalog,
- apply smart filters (budget, category, RAM, refresh rate, portability),
- compare up to 3 laptops side by side,
- use a guided finder wizard,
- ask the AI assistant for recommendations and fit checks.

The project consists of:

- **Frontend:** `/home/theodora/LapStore/laptops-frontend`
- **Backend:** `/home/theodora/LapStore/fastapi-products-backend`

---

## Architecture

```text
Next.js Frontend (React, Zustand, Tailwind)
        |
        |  HTTP (REST)
        v
FastAPI Backend (Products API + Chat API)
        |
        v
MySQL (catalog data)
```

### Runtime flow

1. Frontend calls backend via `NEXT_PUBLIC_API_BASE_URL`.
2. Backend serves product catalog and search endpoints.
3. Chat endpoint performs rule-based (or OpenAI-enabled) recommendation logic.
4. Frontend renders responses in catalog pages, comparison views, and chat widget.

---

## Core Features

### Frontend

- Homepage catalog with advanced filters and sorting
- Product details page with specs, highlights, and review UI
- AI quick assistant widget with session continuity
- Compare page (up to 3 laptops)
- Multi-step recommendation wizard
- Wishlist, cart, checkout, and recently viewed flows
- Bilingual UI (English / Romanian)
- Responsive, polished UI with subtle motion and sticky header behavior

### Backend

- REST API for products (list, detail, search, CRUD)
- Rule-based AI chat endpoint with session-aware follow-ups
- Optional OpenAI integration via env configuration
- MySQL persistence via SQLAlchemy
- CORS configuration for frontend integration
- Health check endpoint for monitoring

---

## Admin Dashboard Overview

The frontend includes an admin interface (`/admin`) intended for demo/portfolio workflows.

### Admin capabilities

- Dashboard KPIs and summary blocks
- Product CRUD UI
- Orders and customer tables with status tags
- Inventory and analytics widgets
- CSV export for products/orders

### Important note

Current admin authentication is local/demo-oriented (temporary credentials and localStorage session), not production-grade RBAC.

---

## Tech Stack

### Frontend (`laptops-frontend`)

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Zustand
- Lucide React

### Backend (`fastapi-products-backend`)

- Python 3.11+
- FastAPI
- SQLAlchemy 2.x
- MySQL + PyMySQL
- Pydantic Settings
- Poetry
- Optional OpenAI SDK integration

---

## Project Structure

```text
/home/theodora/LapStore/
├── laptops-frontend/
│   ├── src/
│   │   ├── app/                # Next.js routes (home, product, compare, wizard, admin)
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Providers (language, cart, toast, confirm)
│   │   ├── lib/                # API client, types, utils, auth helpers
│   │   └── store/              # Zustand stores
│   ├── public/
│   └── package.json
└── fastapi-products-backend/
    ├── app/
    │   ├── routers/            # /products and /chat endpoints
    │   ├── crud/               # DB query logic
    │   ├── models/             # SQLAlchemy models
    │   ├── schemas/            # Pydantic schemas
    │   ├── db/                 # DB session/init/seed
    │   └── core/               # Settings/config
    ├── pyproject.toml
    └── README.md
```

---

## Quick Start (Run Full Stack Locally)

### 1) Start backend

```bash
# backend project
poetry install
```

Create `.env` in `fastapi-products-backend`:

```env
APP_NAME=Products API
ENV=dev
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=products_db

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
LOCAL_BOT_MODE=rule_based
```

Create DB + tables + seed:

```bash
poetry run python -m app.db.init_db
poetry run python -m app.db.seed_laptops
```

Run API:

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Start frontend

In `laptops-frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Install + run:

```bash
npm install
npm run dev
```

### 3) Open

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`
- Backend health: `http://localhost:8000/health`

---

## Environment Variables

### Frontend (`laptops-frontend/.env.local`)

| Variable | Required | Example | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | Base URL of FastAPI backend |

### Backend (`fastapi-products-backend/.env`)

| Variable | Required | Example | Description |
|---|---|---|---|
| `APP_NAME` | No | `Products API` | FastAPI app title |
| `ENV` | No | `dev` | Runtime environment |
| `CORS_ORIGINS` | Yes | `http://localhost:3000,http://127.0.0.1:3000` | Allowed frontend origins |
| `DB_HOST` | Yes | `127.0.0.1` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USER` | Yes | `root` | MySQL user |
| `DB_PASSWORD` | Yes | `your_password` | MySQL password |
| `DB_NAME` | Yes | `products_db` | MySQL database name |
| `OPENAI_API_KEY` | Optional | `sk-...` | Required only for OpenAI mode |
| `OPENAI_MODEL` | Optional | `gpt-4o-mini` | OpenAI model name |
| `LOCAL_BOT_MODE` | Yes | `rule_based` | `rule_based` or `openai` |

---

## API Overview

Base URL: `http://localhost:8000/api/v1`

### Product endpoints

- `GET /products` — list products
- `GET /products/{product_id}` — get product details
- `GET /products/search` — search with filters
- `POST /products` — create product
- `PUT /products/{product_id}` — update product
- `DELETE /products/{product_id}` — delete product

### Chat endpoint

- `POST /chat` — AI/rule-based laptop assistant
  - request body: `message`, `session_id`, optional `language`
  - returns assistant message + matching products + optional quick actions

### Utility endpoint

- `GET /health` — service health check

---

## Usage Guide

1. Start backend and frontend.
2. Browse laptops on homepage.
3. Apply filters and open details pages.
4. Compare shortlisted products in `/compare`.
5. Use `/wizard` for guided recommendations.
6. Ask chat assistant for fit and alternatives.
7. Use `/admin/login` to access admin dashboard demo tools.

---

## Screenshots

Add portfolio screenshots to `laptops-frontend/public/screenshots/`.

Suggested assets:

- `homepage.png`
- `product-details.png`
- `compare.png`
- `wizard.png`
- `chat-widget.png`
- `admin-dashboard.png`
- `swagger-backend.png`

Example:

```md
![Homepage](public/screenshots/homepage.png)
![Backend Swagger](public/screenshots/swagger-backend.png)
```

---

## Deployment

### Frontend (Vercel)

- Deploy `laptops-frontend`
- Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL

### Backend (Render/Railway/VM)

- Deploy `fastapi-products-backend`
- Provision MySQL
- Set backend `.env` vars in host settings
- Configure `CORS_ORIGINS` to include frontend domain

### Production checklist

- [ ] Backend `/health` returns OK
- [ ] Frontend can fetch `/api/v1/products`
- [ ] CORS configured correctly
- [ ] Database is migrated/initialized and seeded
- [ ] Secrets are managed in host env settings

---

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Backend

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
poetry run python -m app.db.init_db
poetry run python -m app.db.seed_laptops
```

---

## Contributing

1. Fork the project
2. Create a branch (`feat/your-feature`)
3. Keep frontend and backend changes scoped and documented
4. Open a PR with:
   - summary,
   - screenshots (for UI changes),
   - API examples (for backend changes)

---

## Roadmap

- Replace demo admin auth with secure backend auth
- Persist frontend review submissions to backend
- Add automated tests (frontend + backend)
- Add CI pipeline with lint/build/test checks
- Add observability (structured logging + error monitoring)

---

## License

Portfolio/demo use by default.
Add a dedicated `LICENSE` file (e.g., MIT) for open-source distribution.
