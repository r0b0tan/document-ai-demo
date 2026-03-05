import JsonViewer from "./JsonViewer.jsx";
import "./ExtractionPanel.css";

export default function ExtractionPanel({ result }) {
  const fieldCount = result?.data ? Object.keys(result.data).length : 0;

  return (
    <section className="extraction-panel">
      <div className="extraction-header">
        <span className="extraction-title">Extracted Fields</span>
        {fieldCount > 0 && (
          <span className="extraction-count">{fieldCount} fields</span>
        )}
      </div>

      <div className="extraction-content">
        <JsonViewer data={result.data} />
      </div>
    </section>
  );
}
