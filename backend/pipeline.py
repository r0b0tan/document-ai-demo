"""
Document processing pipeline.

Stages:
  1. File type detection
  2. Text extraction  (PDF / image / XML / plain text)
  3. Document classification via LLM
  4. Structured field extraction via LLM
  5. Build response payload
"""

import xml.etree.ElementTree as ET
from pathlib import Path

from classify import classify_document
from extract_fields import extract_fields
from extract_image import extract_text_from_image
from extract_pdf import extract_text_from_pdf

# Characters shown in the text_preview field
TEXT_PREVIEW_LENGTH = 500

# Supported MIME types / extensions
SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
SUPPORTED_PDF_TYPES = {"application/pdf"}
SUPPORTED_XML_TYPES = {"application/xml", "text/xml"}
SUPPORTED_TEXT_TYPES = {"text/plain"}


def run_pipeline(filename: str, content_type: str, file_bytes: bytes, model: str = "mistral") -> dict:
    """
    Execute the full document analysis pipeline.

    Args:
        filename:     Original filename from the upload.
        content_type: MIME type reported by the client.
        file_bytes:   Raw file content.
        model:        Ollama model name.

    Returns:
        dict matching AnalyzeResponse schema.
    """
    # ── Stage 1: file type detection ─────────────────────────────────────────
    detected_type = _detect_file_type(filename, content_type)

    # ── Stage 2: text extraction ──────────────────────────────────────────────
    text = _extract_text(detected_type, file_bytes, filename)

    if not text:
        raise ValueError("No text could be extracted from the document.")

    # ── Stage 3: document classification ─────────────────────────────────────
    classification = classify_document(text, model=model)
    document_type = classification.get("document_type", "unknown")
    confidence = classification.get("confidence")

    # ── Stage 4: structured field extraction ─────────────────────────────────
    data = extract_fields(text, document_type, model=model)

    # ── Stage 5: assemble response ────────────────────────────────────────────
    return {
        "filename": filename,
        "document_type": document_type,
        "data": data,
        "text_preview": text[:TEXT_PREVIEW_LENGTH],
        "confidence": confidence,
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _detect_file_type(filename: str, content_type: str) -> str:
    """
    Determine the canonical file category from MIME type and extension.
    Returns one of: 'pdf', 'image', 'xml', 'text', 'unknown'.
    """
    ext = Path(filename).suffix.lower()

    if content_type in SUPPORTED_PDF_TYPES or ext == ".pdf":
        return "pdf"

    if content_type in SUPPORTED_IMAGE_TYPES or ext in {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}:
        return "image"

    if content_type in SUPPORTED_XML_TYPES or ext == ".xml":
        return "xml"

    if content_type in SUPPORTED_TEXT_TYPES or ext in {".txt", ".text"}:
        return "text"

    return "unknown"


def _extract_text(detected_type: str, file_bytes: bytes, filename: str) -> str:
    """Route to the correct extractor based on detected file type."""
    if detected_type == "pdf":
        return extract_text_from_pdf(file_bytes)

    if detected_type == "image":
        return extract_text_from_image(file_bytes)

    if detected_type == "xml":
        return _extract_text_from_xml(file_bytes)

    if detected_type == "text":
        return file_bytes.decode("utf-8", errors="replace").strip()

    # Unknown type: attempt UTF-8 decode, fall back to image OCR
    try:
        decoded = file_bytes.decode("utf-8", errors="strict").strip()
        if decoded:
            return decoded
    except UnicodeDecodeError:
        pass

    # Last resort: try OCR
    return extract_text_from_image(file_bytes)


def _extract_text_from_xml(file_bytes: bytes) -> str:
    """
    Parse XML and produce a human-readable flat text representation
    so the LLM can classify and extract fields from it.
    """
    try:
        root = ET.fromstring(file_bytes)
        lines: list[str] = []
        _walk_xml(root, lines, depth=0)
        return "\n".join(lines)
    except ET.ParseError as exc:
        # Fall back to raw text if XML is malformed
        raw = file_bytes.decode("utf-8", errors="replace")
        return f"[XML parse error: {exc}]\n{raw}"


def _walk_xml(element: ET.Element, lines: list[str], depth: int) -> None:
    """Recursively flatten XML into indented key: value lines."""
    indent = "  " * depth
    tag = element.tag.split("}")[-1] if "}" in element.tag else element.tag  # strip namespace
    text = (element.text or "").strip()

    if text:
        lines.append(f"{indent}{tag}: {text}")
    else:
        lines.append(f"{indent}{tag}:")

    for child in element:
        _walk_xml(child, lines, depth + 1)
