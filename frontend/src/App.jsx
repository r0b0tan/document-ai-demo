import { useState } from "react";
import { analyzeDocument } from "./api.js";
import Upload from "./components/Upload.jsx";
import ResultView from "./components/ResultView.jsx";
import "./App.css";

const MODELS = ["mistral", "llama3", "phi3", "gemma"];

export default function App() {
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [model, setModel] = useState("mistral");

  async function handleFileSelect(selectedFile) {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const data = await analyzeDocument(selectedFile, model);
      setResult(data);
    } catch (err) {
      setError(err.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">🧠</span>
            <span className="brand-name">Document AI</span>
          </div>

          <div className="header-controls">
            <label className="model-label" htmlFor="model-select">
              Model
            </label>
            <select
              id="model-select"
              className="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="app-main">
        {/* Upload area — shown until analysis is complete */}
        {!result && (
          <section className="upload-section">
            <h1 className="upload-headline">
              Upload a document — get structured data back
            </h1>
            <p className="upload-subline">
              Supports PDF, images (JPG / PNG), plain text, and XML.
              <br />
              Powered by Ollama running locally.
            </p>

            <Upload onFileSelect={handleFileSelect} disabled={loading} />

            {/* Processing spinner */}
            {loading && file && (
              <div className="loading-indicator">
                <span className="spinner" />
                <span>
                  Analyzing <strong>{file.name}</strong> with{" "}
                  <strong>{model}</strong>&hellip;
                </span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="error-banner" role="alert">
                <strong>Error: </strong>
                {error}
              </div>
            )}
          </section>
        )}

        {/* Result view */}
        {result && (
          <section className="result-section">
            <ResultView result={result} file={file} />

            <button className="reset-btn" onClick={handleReset}>
              Analyze another document
            </button>
          </section>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="app-footer">
        Document AI Demo &mdash; local LLM via Ollama
      </footer>
    </div>
  );
}
