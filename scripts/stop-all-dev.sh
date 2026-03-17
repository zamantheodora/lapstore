#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PIDS="$({
  pgrep -f "${ROOT_DIR}/laptops-frontend.*next dev" || true
  pgrep -f "${ROOT_DIR}/fastapi-products-backend.*uvicorn app.main:app --reload" || true
  pgrep -f "concurrently -n frontend,backend" || true
} | sort -u)"

if [[ -z "${PIDS}" ]]; then
  echo "No matching dev processes found."
  exit 0
fi

echo "Stopping processes: ${PIDS//$'\n'/, }"
kill ${PIDS} || true
sleep 1

for pid in ${PIDS}; do
  if kill -0 "${pid}" 2>/dev/null; then
    kill -9 "${pid}" || true
  fi
done

echo "Done."
