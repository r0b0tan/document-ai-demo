"""
FastAPI application entry point.

Endpoints:
  POST /analyze   — Upload a document for AI analysis
  GET  /health    — Liveness check
"""

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import ollama
from pipeline import run_pipeline
from schemas import AnalyzeResponse

app = FastAPI(
    title="Document AI Demo",
    description="AI-powered document understanding using Ollama + FastAPI.",
    version="1.0.0",
)

# Allow the Vite dev server (localhost:5173) to reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maximum upload size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024

# Ollama model used for classification and extraction
DEFAULT_MODEL = "mistral"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
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


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
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
        raise HTTPException(status_code=500, detail=f"Pipeline error: {exc}")

    return AnalyzeResponse(**result)
