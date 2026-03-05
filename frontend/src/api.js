/**
 * API client — talks to the FastAPI backend.
 *
 * The Vite proxy (vite.config.js) forwards /analyze to http://localhost:8000,
 * so no absolute URL is needed here.
 */

const BASE_URL = "";

// Optional API key — set VITE_API_KEY in .env or environment when deploying.
const API_KEY = import.meta.env.VITE_API_KEY || "";

function authHeaders() {
  const headers = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  return headers;
}

/**
 * Upload a file and request AI analysis.
 *
 * @param {File}   file   - The file object from the input / drop event.
 * @param {string} model  - Ollama model name (default: "mistral").
 * @returns {Promise<Object>} Parsed AnalyzeResponse JSON.
 * @throws {Error} with a human-readable message on HTTP or network failure.
 */
export async function analyzeDocument(file, model = "mistral") {
  const body = new FormData();
  body.append("file", file);
  body.append("model", model);

  const response = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail ?? detail;
    } catch {
      /* ignore JSON parse failure */
    }
    throw new Error(detail);
  }

  return response.json();
}

/**
 * Check if the backend is reachable.
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch available Ollama models from the backend.
 * @returns {Promise<string[]>} Array of model names.
 */
export async function fetchModels() {
  const res = await fetch(`${BASE_URL}/models`, { headers: authHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.models ?? [];
}
