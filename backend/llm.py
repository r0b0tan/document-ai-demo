"""
LLM provider abstraction.

Supports two backends, selected via the LLM_PROVIDER environment variable:
  - "ollama"  (default) — local Ollama instance
  - "groq"              — Groq cloud API (requires GROQ_API_KEY)

Both expose the same interface: `chat(prompt, model) -> str`
"""

import os

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Default models per provider
DEFAULT_MODELS = {
    "ollama": "mistral",
    "groq": "mistral-saba-24b",
}


def get_default_model() -> str:
    return DEFAULT_MODELS.get(LLM_PROVIDER, "mistral")


def chat(prompt: str, model: str) -> str:
    """Send a prompt to the configured LLM provider and return the response text."""
    if LLM_PROVIDER == "groq":
        return _chat_groq(prompt, model)
    return _chat_ollama(prompt, model)


def list_models() -> list[dict]:
    """Return models with availability status. Each entry: {"name": str, "available": bool}."""
    if LLM_PROVIDER == "groq":
        return _list_models_groq()
    return _list_models_ollama()


def check_available() -> bool:
    """Quick check whether the current provider can accept requests."""
    if LLM_PROVIDER == "groq":
        return _check_groq_available()
    return True


# ── Ollama backend ───────────────────────────────────────────────────────────

def _chat_ollama(prompt: str, model: str) -> str:
    import ollama

    response = ollama.chat(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0},
    )
    return response["message"]["content"].strip()


def _list_models_ollama() -> list[dict]:
    import ollama

    try:
        response = ollama.list()
        names = sorted(m.model.split(":")[0] for m in response.models)
        seen = set()
        unique = []
        for n in names:
            if n not in seen:
                seen.add(n)
                unique.append(n)
        return [{"name": n, "available": True} for n in unique]
    except Exception:
        return []


# ── Groq backend ─────────────────────────────────────────────────────────────

def _chat_groq(prompt: str, model: str) -> str:
    from groq import Groq

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.choices[0].message.content.strip()


def _check_groq_available() -> bool:
    """Check if Groq API has remaining rate limit tokens."""
    import httpx

    try:
        resp = httpx.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            timeout=5,
        )
        remaining = resp.headers.get("x-ratelimit-remaining-tokens")
        if remaining is not None and int(remaining) <= 0:
            return False
        return resp.status_code == 200
    except Exception:
        return False


def _list_models_groq() -> list[dict]:
    from groq import Groq

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.models.list()
        available = _check_groq_available()
        return sorted(
            [{"name": m.id, "available": available} for m in response.data if m.active],
            key=lambda x: x["name"],
        )
    except Exception:
        return []
