import { useState, useEffect } from "react";
import { analyzeDocument, fetchModels } from "./api.js";
import TopBar from "./components/TopBar.jsx";
import UploadOverlay from "./components/UploadOverlay.jsx";
import Workspace from "./components/Workspace.jsx";
import "./App.css";

export default function App() {
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Empty model = let the backend use its configured default
  const [model, setModel] = useState("");
  const [models, setModels] = useState([]);

  useEffect(() => {
    fetchModels().then(({ models: m, defaultModel }) => {
      setModels(m);
      // Always pick a model from the backend's list so we never send one it rejects
      const available = m.filter((x) => x.available);
      const pick =
        available.find((x) => x.name === defaultModel) ??
        available[0] ??
        m.find((x) => x.name === defaultModel) ??
        m[0];
      setModel(pick?.name ?? "");
    });
  }, []);

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
      <TopBar
        model={model}
        models={models}
        onModelChange={setModel}
        onReset={handleReset}
        showReset={!!result || loading}
        loading={loading}
      />
      <main className="app-main">
        {result ? (
          <Workspace result={result} file={file} model={model} />
        ) : (
          <UploadOverlay
            onFileSelect={handleFileSelect}
            disabled={loading}
            loading={loading}
            file={file}
            model={model}
            error={error}
          />
        )}
      </main>
      <footer className="app-footer">
        © 2026 Christoph Bauer
      </footer>
    </div>
  );
}
