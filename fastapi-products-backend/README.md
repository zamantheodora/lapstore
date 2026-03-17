# FastAPI Products Backend (MySQL + SQLAlchemy + Poetry)

## 1) Prerequisites

- Python 3.11+
- Poetry
- A running MySQL server

## 2) Setup

```bash
# from anywhere
mkdir -p /home/theodora/LapStore/fastapi-products-backend

# enter the project folder
cd /home/theodora/LapStore/fastapi-products-backend

# install deps
poetry install
```

## 3) Configure environment

Create a `.env` file in the project root (same folder as `pyproject.toml`):

```env
APP_NAME=Products API
ENV=dev

# For Vercel, set this to your deployed frontend domain.
# Example: https://my-frontend.vercel.app
CORS_ORIGINS=https://my-frontend.vercel.app,http://localhost:3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=products_db

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Chatbot mode: rule_based (no external calls) or openai
LOCAL_BOT_MODE=rule_based
```

## 4) Create the database

```sql
CREATE DATABASE products_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 5) Create tables

This project uses SQLAlchemy metadata create (no Alembic by default).

```bash
poetry run python -m app.db.init_db
```

## 6) Run the API

```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- Swagger UI: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

## 7) Example requests

```bash
curl -X POST http://localhost:8000/api/v1/products \
  -H 'Content-Type: application/json' \
  -d '{"cover_photo":"https://example.com/p.jpg","title":"Laptop A","description":"Desc","price":2499,"brand":"Lenovo","cpu":"Ryzen 5 5500U","ram_gb":16,"storage_gb":512,"gpu":"Radeon Graphics","screen_inches":15.6,"weight_kg":1.65,"battery_hours":8,"os":"Windows","category":"school","resolution":"1920x1080","refresh_hz":60}'

curl http://localhost:8000/api/v1/products

curl 'http://localhost:8000/api/v1/products/search?category=gaming&min_price=5000&refresh_hz=144'
```

## 8) Seed laptops

Seed data is stored in `app/db/laptops.seed.json`.

```bash
poetry run python -m app.db.seed_laptops
```

## 9) AI Shopping Assistant Chat

### Endpoint

`POST /api/v1/chat`

Body:

```json
{
  "message": "Vreau un laptop de gaming până în 6500 lei, 16GB RAM, 144Hz",
  "session_id": "demo"
}
```

Example:

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Vreau un laptop de gaming până în 6500 lei, 16GB RAM, 144Hz","session_id":"demo"}'
```

Notes:

- Session memory is kept in-process in a Python dict. Restarting the server clears it.
- In `LOCAL_BOT_MODE=rule_based`, the endpoint uses local regex rules + DB search only and always returns HTTP 200.
- If budget or category is missing, the API returns `clarifying_question`.

### Example conversation (rule_based + session_id)

Message 1 (`session_id=demo`):

```json
{
  "message": "I want a gaming laptop under 6000 RON",
  "session_id": "demo"
}
```

Message 2 (same `session_id=demo`):

```json
{
  "message": "with 16GB RAM and 144Hz",
  "session_id": "demo"
}
```

Expected merged filters after message 2:

- `max_price`: 6000
- `category`: gaming
- `ram_gb`: 16
- `refresh_hz`: 144

### Follow-ups (rule_based intents)

With the same `session_id`, you can send short follow-ups like:

- `"mai ieftin"` / `"cheaper"` (adjusts budget downward)
- `"mai scump"` / `"more expensive"` (adjusts budget upward)
- `"mai puternic"` / `"more powerful"` (bumps defaults like RAM=16, and 144Hz for gaming)
- `"mai ușor"` / `"lighter"` (sorts by weight)
- `"mai multă baterie"` / `"better battery"` (sorts by battery life)

### Rule-based parsing examples (quick tests)

These are examples of what the rule-based extractor should interpret:

- **Example 1**
  - Message: `"gaming sub 6000 lei 16GB RAM 144Hz"`
  - Expected: `category=gaming`, `max_price=6000`, `ram_gb=16`, `refresh_hz=144`

- **Example 2**
  - Message: `"vreau Lenovo 16GB"`
  - Expected: `brand=Lenovo`, `ram_gb=16` (NOT storage)

- **Example 3**
  - Message: `"SSD 1TB"` or `"storage 512GB"`
  - Expected: `storage_gb=1000` or `storage_gb=512`

### Rule-based fallback (auto-relax)

If no results are found but filters exist, the rule-based bot retries by relaxing constraints in this order:

1. Reduce `refresh_hz` (144 -> 120 -> 60)
2. Reduce `ram_gb` (>=16 -> 8)
3. Remove `category`

If results are still empty and `max_price` is set, the bot will return **closest options slightly above budget** by temporarily removing `max_price` and sorting by price ascending.
