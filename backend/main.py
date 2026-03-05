"""
FastAPI application entry point.

Endpoints:
  POST /analyze   — Upload a document for AI analysis
  GET  /health    — Liveness check
"""

import logging
import os
import re
import secrets

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

import ollama
from pipeline import run_pipeline
from schemas import AnalyzeResponse

logger = logging.getLogger("document-ai")

# ── Configuration via environment variables ──────────────────────────────────

# Comma-separated list of allowed CORS origins.
# Default: localhost dev servers. Set to your real domain in production.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

# Optional API key. When set, every request must include an
# "X-API-Key" header with this value. Leave unset to disable auth.
API_KEY = os.getenv("API_KEY")

# Comma-separated whitelist of Ollama model names that clients may use.
ALLOWED_MODELS = [
    m.strip()
    for m in os.getenv("ALLOWED_MODELS", "mistral,llama3,gemma").split(",")
    if m.strip()
]

# Rate limit for the /analyze endpoint (per remote IP).
ANALYZE_RATE_LIMIT = os.getenv("ANALYZE_RATE_LIMIT", "5/minute")

# ── App setup ────────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Document AI Demo",
    description="AI-powered document understanding using Ollama + FastAPI.",
    version="1.0.0",
)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Maximum upload size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024

# Ollama model used for classification and extraction
DEFAULT_MODEL = "mistral"

# ── Auth dependency ──────────────────────────────────────────────────────────


async def verify_api_key(request: Request):
    """Reject requests with an invalid API key (if API_KEY is configured)."""
    if API_KEY is None:
        return
    client_key = request.headers.get("X-API-Key", "")
    if not secrets.compare_digest(client_key, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


# ── Endpoints ────────────────────────────────────────────────────────────────

# Model name validation: alphanumeric, hyphens, underscores, dots, colons
_MODEL_RE = re.compile(r"^[a-zA-Z0-9._:-]{1,64}$")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models", dependencies=[Depends(verify_api_key)])
def list_models():
    """Return names of locally available Ollama models."""
    try:
        response = ollama.list()
        names = sorted(m.model.split(":")[0] for m in response.models)
        # deduplicate (same base name with different tags)
        seen = set()
        unique = []
        for n in names:
            if n not in seen:
                seen.add(n)
                unique.append(n)
        return {"models": unique}
    except Exception:
        return {"models": []}


@app.post("/analyze", response_model=AnalyzeResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit(ANALYZE_RATE_LIMIT)
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    model: str = Form(DEFAULT_MODEL),
):
    """
    Analyze an uploaded document.

    - Detects file type
    - Extracts text (PDF / OCR / XML / plain text)
    - Classifies the document via LLM
    - Extracts structured fields via LLM
    - Returns JSON result
    """
    # Validate model name format and whitelist
    if not _MODEL_RE.match(model):
        raise HTTPException(status_code=400, detail="Invalid model name.")
    if model not in ALLOWED_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model not allowed. Choose from: {', '.join(ALLOWED_MODELS)}",
        )

    # Read file content
    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    content_type = file.content_type or "application/octet-stream"

    try:
        result = run_pipeline(
            filename=file.filename or "document",
            content_type=content_type,
            file_bytes=file_bytes,
            model=model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Pipeline error during /analyze")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the document.")

    return AnalyzeResponse(**result)
