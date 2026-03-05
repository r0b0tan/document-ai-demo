"""
Structured field extraction per document type via Ollama LLM.
Each extractor returns a dict of fields specific to that document type.
"""

import json
import re
import ollama

# Max characters sent to the LLM for field extraction
EXTRACTION_TEXT_LIMIT = 3000


def extract_fields(text: str, document_type: str, model: str = "mistral") -> dict:
    """
    Dispatch to the appropriate extractor based on document_type.
    Falls back to a generic extractor for unknown types.
    """
    truncated = text[:EXTRACTION_TEXT_LIMIT]

    extractors = {
        "invoice": _extract_invoice,
        "resume": _extract_resume,
        "contract": _extract_contract,
        "letter": _extract_letter,
        "report": _extract_report,
        "form": _extract_form,
        "xml_document": _extract_xml_document,
    }

    extractor = extractors.get(document_type, _extract_generic)
    return extractor(truncated, model)


# ---------------------------------------------------------------------------
# Per-type extractors
# ---------------------------------------------------------------------------

def _extract_invoice(text: str, model: str) -> dict:
    schema = {
        "vendor": None,
        "vendor_address": None,
        "invoice_number": None,
        "invoice_date": None,
        "due_date": None,
        "bill_to": None,
        "currency": None,
        "line_items": [],
        "subtotal": None,
        "tax_amount": None,
        "total_amount": None,
        "payment_terms": None,
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_resume(text: str, model: str) -> dict:
    schema = {
        "name": None,
        "email": None,
        "phone": None,
        "location": None,
        "summary": None,
        "skills": [],
        "experience": [
            {"title": None, "company": None, "dates": None, "description": None}
        ],
        "education": [
            {"degree": None, "institution": None, "dates": None}
        ],
        "certifications": [],
        "languages": [],
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_contract(text: str, model: str) -> dict:
    schema = {
        "parties": [],
        "effective_date": None,
        "expiration_date": None,
        "governing_law": None,
        "compensation": None,
        "key_terms": [],
        "termination_clause": None,
        "confidentiality": None,
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_letter(text: str, model: str) -> dict:
    schema = {
        "sender": None,
        "recipient": None,
        "date": None,
        "subject": None,
        "tone": None,
        "key_points": [],
        "action_items": [],
        "summary": None,
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_report(text: str, model: str) -> dict:
    schema = {
        "title": None,
        "author": None,
        "date": None,
        "report_type": None,
        "executive_summary": None,
        "key_findings": [],
        "recommendations": [],
        "data_points": [],
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_form(text: str, model: str) -> dict:
    schema = {
        "form_title": None,
        "fields": {},
        "submission_date": None,
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_xml_document(text: str, model: str) -> dict:
    schema = {
        "root_element": None,
        "namespaces": [],
        "key_elements": [],
        "summary": None,
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


def _extract_generic(text: str, model: str) -> dict:
    schema = {
        "title": None,
        "date": None,
        "author": None,
        "summary": None,
        "key_entities": [],
    }
    prompt = _build_prompt(text, schema)
    return _llm_extract(prompt, model, schema)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_prompt(text: str, schema: dict) -> str:
    schema_str = json.dumps(schema, indent=2)
    return f"""You are a structured data extraction engine. Extract information from the document below.

Fill in the following JSON schema. Use null for fields you cannot determine. Do not add extra keys.
Respond ONLY with the filled JSON object (no markdown, no explanation).

Schema:
{schema_str}

Document text:
\"\"\"
{text}
\"\"\"
"""


def _llm_extract(prompt: str, model: str, fallback: dict) -> dict:
    """Call the LLM and parse the JSON response, falling back to the schema defaults."""
    try:
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0},
        )
        raw = response["message"]["content"].strip()
        return _parse_json(raw, fallback)
    except Exception:
        return fallback


def _parse_json(raw: str, fallback: dict) -> dict:
    """Parse JSON from LLM output, stripping markdown fences if necessary."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).replace("```", "").strip()

    try:
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
                if isinstance(result, dict):
                    return result
            except json.JSONDecodeError:
                pass

    return fallback
