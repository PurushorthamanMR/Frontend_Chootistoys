#!/usr/bin/env bash
# Pull latest code and build production frontend (Vite → dist/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[deploy] Working directory: $ROOT"

if [ -d .git ]; then
  echo "[deploy] git pull..."
  git pull --ff-only
fi

echo "[deploy] npm install..."
npm install

echo "[deploy] npm run build..."
npm run build

echo "[deploy] Done. Output: $ROOT/dist"
