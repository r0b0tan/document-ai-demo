#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Start the full Document AI Demo stack for local development.
#
# Starts (in order):
#   1. Ollama        (skipped if already running)
#   2. FastAPI backend   on http://localhost:8000
#   3. Vite frontend     on http://localhost:5173
#
# All processes are killed cleanly when you press Ctrl+C.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

OLLAMA_MODEL="${OLLAMA_MODEL:-mistral}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# PIDs we need to clean up
PIDS=()

# ─── Colours ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()  { echo -e "${BOLD}[dev]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok]${RESET}  $*"; }
warn() { echo -e "${YELLOW}[warn]${RESET} $*"; }
err()  { echo -e "${RED}[err]${RESET}  $*" >&2; }

# ─── Cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
  echo ""
  log "Shutting down..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Give processes a moment to exit gracefully
  sleep 0.5
  ok "All processes stopped. Bye!"
}
trap cleanup EXIT INT TERM

# ─── Helpers ─────────────────────────────────────────────────────────────────
require() {
  if ! command -v "$1" &>/dev/null; then
    err "Required command not found: $1"
    err "  $2"
    exit 1
  fi
}

wait_for_port() {
  local label="$1" port="$2" timeout="${3:-30}"
  local elapsed=0
  printf "  Waiting for %s (port %s)" "$label" "$port"
  while ! nc -z 127.0.0.1 "$port" 2>/dev/null; do
    sleep 0.5
    elapsed=$((elapsed + 1))
    printf "."
    if [[ $elapsed -ge $((timeout * 2)) ]]; then
      echo ""
      err "$label did not start within ${timeout}s. Check the log above."
      exit 1
    fi
  done
  echo ""
  ok "$label is ready"
}

# ─── Preflight checks ─────────────────────────────────────────────────────────
log "Running preflight checks..."

require ollama  "Install from https://ollama.com"
require python3 "Install Python 3.10+"
require node    "Install Node.js 18+ from https://nodejs.org"
require npm     "Install Node.js 18+ from https://nodejs.org"
require nc      "Install netcat (e.g. apt install netcat-openbsd)"

# Check virtual environment
VENV_PYTHON="$BACKEND_DIR/.venv/bin/python"
if [[ ! -x "$VENV_PYTHON" ]]; then
  warn "No virtualenv found at backend/.venv — creating one..."
  python3 -m venv "$BACKEND_DIR/.venv"
  ok "Virtualenv created"
fi

# Install backend deps if needed
if ! "$VENV_PYTHON" -c "import fastapi" 2>/dev/null; then
  log "Installing backend dependencies..."
  "$BACKEND_DIR/.venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"
  ok "Backend dependencies installed"
fi

# Install frontend deps if needed
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  log "Installing frontend dependencies..."
  npm --prefix "$FRONTEND_DIR" install --silent
  ok "Frontend dependencies installed"
fi

ok "Preflight checks passed"
echo ""

# ─── 1. Ollama ────────────────────────────────────────────────────────────────
if nc -z 127.0.0.1 11434 2>/dev/null; then
  ok "Ollama already running — skipping start"
else
  log "Starting Ollama..."
  ollama serve &>/tmp/document-ai-ollama.log &
  PIDS+=($!)
  wait_for_port "Ollama" 11434 30
fi

# Pull the model if it isn't present (non-fatal — user may have it under a different tag)
if ! ollama list 2>/dev/null | grep -q "^${OLLAMA_MODEL}"; then
  log "Pulling model: ${OLLAMA_MODEL}  (this may take a while on first run...)"
  ollama pull "$OLLAMA_MODEL" || warn "Could not pull $OLLAMA_MODEL — it may already be cached under a tag."
fi

# ─── 2. Backend ───────────────────────────────────────────────────────────────
log "Starting FastAPI backend on port ${BACKEND_PORT}..."
(
  cd "$BACKEND_DIR"
  .venv/bin/uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" --reload \
    2>&1 | sed 's/^/  [backend] /'
) &
PIDS+=($!)
wait_for_port "Backend" "$BACKEND_PORT" 20

# ─── 3. Frontend ──────────────────────────────────────────────────────────────
log "Starting Vite frontend on port ${FRONTEND_PORT}..."
(
  cd "$FRONTEND_DIR"
  npm run dev -- --port "$FRONTEND_PORT" \
    2>&1 | sed 's/^/  [frontend] /'
) &
PIDS+=($!)
wait_for_port "Frontend" "$FRONTEND_PORT" 20

# ─── Ready ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Document AI Demo is running${RESET}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${CYAN}Frontend${RESET}  →  http://localhost:${FRONTEND_PORT}"
echo -e "  ${CYAN}Backend${RESET}   →  http://localhost:${BACKEND_PORT}"
echo -e "  ${CYAN}API docs${RESET}  →  http://localhost:${BACKEND_PORT}/docs"
echo -e "  ${CYAN}Model${RESET}     →  ${OLLAMA_MODEL}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop all services."
echo ""

# Wait for all background jobs — script stays alive until Ctrl+C
wait
