#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

pick_port() {
  python3 - <<'PY'
import socket

for port in [8000, *range(8001, 8101)]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        if s.connect_ex(("127.0.0.1", port)) != 0:
            print(port)
            break
PY
}

BACKEND_PORT="$(pick_port)"
API_BASE_URL="http://localhost:${BACKEND_PORT}"

echo "Starting backend on ${API_BASE_URL}"

auto_frontend_cmd="NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL} npm run dev --prefix \"${ROOT_DIR}/laptops-frontend\""
auto_backend_cmd="poetry --directory \"${ROOT_DIR}/fastapi-products-backend\" run uvicorn app.main:app --reload --port ${BACKEND_PORT} --app-dir \"${ROOT_DIR}/fastapi-products-backend\" --env-file \"${ROOT_DIR}/fastapi-products-backend/.env\""

npx concurrently -n frontend,backend -c blue,green "${auto_frontend_cmd}" "${auto_backend_cmd}"
