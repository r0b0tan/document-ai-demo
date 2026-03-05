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

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

STEP=0
TOTAL_STEPS=6
step() { STEP=$((STEP + 1)); echo -e "\n${CYAN}━━━ Step ${STEP}/${TOTAL_STEPS}: $* ━━━${RESET}"; }
log()  { echo -e "${BOLD}[deploy]${RESET} $*"; }
ok()   { echo -e "${GREEN}  ✔${RESET} $*"; }
warn() { echo -e "${YELLOW}  ⚠${RESET} $*"; }
err()  { echo -e "${RED}  ✘${RESET} $*" >&2; }

echo -e "${BOLD}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     Document AI Demo — Deployment         ║${RESET}"
echo -e "${BOLD}╚═══════════════════════════════════════════╝${RESET}"

# ── Step 1: Preflight checks ────────────────────────────────────────────────
step "Preflight checks"

if [[ ! -f .env ]]; then
  err ".env not found. Copy .env.example to .env and configure it first."
  exit 1
fi
ok ".env file found"

if ! command -v docker &>/dev/null; then
  err "docker is not installed."
  exit 1
fi
ok "Docker is available ($(docker --version | head -c 40))"

if ! docker compose version &>/dev/null; then
  err "docker compose plugin is not installed."
  exit 1
fi
ok "Docker Compose is available"

# ── Step 2: Build backend image ──────────────────────────────────────────────
step "Building backend image (Python + Tesseract)"
log "This downloads the Python base image and installs dependencies..."
docker compose build backend
ok "Backend image built"

# ── Step 3: Build frontend image ─────────────────────────────────────────────
step "Building frontend image (Node build + nginx)"
log "This runs 'npm ci' and 'npm run build', then packages with nginx..."
docker compose build frontend
ok "Frontend image built"

# ── Step 4: Start all containers ─────────────────────────────────────────────
step "Starting all containers"
docker compose up -d
ok "Containers started"

log "Waiting for Ollama to be ready..."
for i in $(seq 1 30); do
  if docker compose exec -T ollama ollama list &>/dev/null; then
    break
  fi
  printf "."
  sleep 2
done
echo ""
ok "Ollama is ready"

# ── Step 5: Pull LLM model ──────────────────────────────────────────────────
OLLAMA_MODEL="$(grep -oP '^ALLOWED_MODELS=\K[^,]+' .env 2>/dev/null || echo mistral)"
step "Downloading Ollama model '${OLLAMA_MODEL}' (~4 GB)"
log "This is the slowest step — downloading the AI model. Please be patient..."
docker compose exec -T ollama ollama pull "$OLLAMA_MODEL"
ok "Model '${OLLAMA_MODEL}' is ready"

# ── Step 6: Verify services ─────────────────────────────────────────────────
step "Verifying services"

check_service() {
  local name="$1" url="$2"
  if curl -sf --max-time 5 "$url" &>/dev/null; then
    ok "$name is responding at $url"
  else
    warn "$name is not responding yet at $url (may still be starting)"
  fi
}

check_service "Frontend" "http://127.0.0.1:3000"
check_service "Backend"  "http://127.0.0.1:8000/health"

echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║        Deployment complete! 🚀            ║${RESET}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════╝${RESET}"
echo ""
echo "  Frontend → http://127.0.0.1:3000"
echo "  Backend  → http://127.0.0.1:8000"
echo ""
echo "  Next: Point your nginx reverse proxy to http://127.0.0.1:3000"
echo "  See nginx-site.conf for a ready-made config."
