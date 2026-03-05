import { useState } from "react";
import { analyzeDocument } from "./api.js";
import TopBar from "./components/TopBar.jsx";
import UploadOverlay from "./components/UploadOverlay.jsx";
import Workspace from "./components/Workspace.jsx";
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
      <TopBar
        model={model}
        models={MODELS}
        onModelChange={setModel}
        onReset={handleReset}
        showReset={!!result || loading}
        loading={loading}
      />
      <main className="app-main">
        {result ? (
          <Workspace result={result} file={file} />
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
    </div>
  );
}
