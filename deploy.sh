#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Build and start the Document AI Demo on a production server.
#
# Usage:
#   1. Copy .env.example to .env and configure it
#   2. Run: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; BOLD='\033[1m'; RESET='\033[0m'
log() { echo -e "${BOLD}[deploy]${RESET} $*"; }
ok()  { echo -e "${GREEN}[ok]${RESET}     $*"; }
err() { echo -e "${RED}[err]${RESET}    $*" >&2; }

# ── Preflight ────────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  err ".env not found. Copy .env.example to .env and configure it first."
  exit 1
fi

if ! command -v docker &>/dev/null; then
  err "docker is not installed."
  exit 1
fi

# ── Build & start ────────────────────────────────────────────────────────────
log "Building containers..."
docker compose build

log "Starting services..."
docker compose up -d

# ── Pull Ollama model if not present ─────────────────────────────────────────
OLLAMA_MODEL="$(grep -oP '^ALLOWED_MODELS=\K[^,]+' .env 2>/dev/null || echo mistral)"
log "Ensuring Ollama model '$OLLAMA_MODEL' is available..."
docker compose exec ollama ollama pull "$OLLAMA_MODEL"

ok "Deployment complete!"
echo ""
echo "  Frontend → http://127.0.0.1:3000"
echo "  Backend  → http://127.0.0.1:8000"
echo ""
echo "  Point your nginx reverse proxy to http://127.0.0.1:3000"
