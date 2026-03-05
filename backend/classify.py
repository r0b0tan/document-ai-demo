"""
Document classification via Ollama LLM.
Returns document type and an optional confidence score.
"""

import json
import re
import ollama

# Supported document types
DOCUMENT_TYPES = [
    "invoice",
    "resume",
    "contract",
    "letter",
    "report",
    "form",
    "xml_document",
    "unknown",
]

# Truncate text to avoid context overflow (~2000 chars is safe for classification)
CLASSIFICATION_TEXT_LIMIT = 2000


def classify_document(text: str, model: str = "mistral") -> dict:
    """
    Classify the document type using the LLM.

    Returns a dict like:
        {"document_type": "invoice", "confidence": 0.92}
    """
    truncated = text[:CLASSIFICATION_TEXT_LIMIT]

    prompt = f"""You are a document classifier. Analyze the following document text and determine its type.

Valid document types are: {", ".join(DOCUMENT_TYPES)}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{{"document_type": "<type>", "confidence": <0.0 to 1.0>}}

Document text:
\"\"\"
{truncated}
\"\"\"
"""

    raw = _call_llm(prompt, model)
    return _parse_json_response(raw, fallback={"document_type": "unknown", "confidence": 0.0})


def _call_llm(prompt: str, model: str) -> str:
    """Send a prompt to the local Ollama instance and return the response text."""
    response = ollama.chat(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0},
    )
    return response["message"]["content"].strip()


def _parse_json_response(raw: str, fallback: dict) -> dict:
    """
    Attempt to parse a JSON object from the LLM response.
    Strips markdown code fences if present.
    Returns fallback dict on failure.
    """
    # Strip markdown code fences (```json ... ```)
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try extracting the first JSON object via regex
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return fallback
