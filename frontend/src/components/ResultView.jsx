import JsonViewer from "./JsonViewer.jsx";
import "./ResultView.css";

const TYPE_LABELS = {
  invoice:      { label: "Invoice",      icon: "🧾" },
  resume:       { label: "Resume / CV",  icon: "📋" },
  contract:     { label: "Contract",     icon: "📝" },
  letter:       { label: "Letter",       icon: "✉️"  },
  form:         { label: "Form",         icon: "📊" },
  xml_document: { label: "XML Document", icon: "🗂️"  },
  unknown:      { label: "Unknown",      icon: "❓" },
};

/**
 * Display the analysis result returned by the backend.
 *
 * Props:
 *   result: AnalyzeResponse object
 *   file:   original File object (used for preview)
 */
export default function ResultView({ result, file }) {
  const { filename, document_type, data, text_preview, confidence } = result;
  const meta = TYPE_LABELS[document_type] ?? TYPE_LABELS.unknown;
  const isPdf = file?.type === "application/pdf";

  return (
    <div className="result-root">
      <h2 className="result-heading">Analysis Result</h2>

      <div className="result-layout">
        {/* ── Left panel: metadata + preview ───────────────────────── */}
        <aside className="result-meta">
          <div className="meta-card">
            <div className="doc-type-badge">
              <span className="doc-icon">{meta.icon}</span>
              <span className="doc-label">{meta.label}</span>
            </div>

            <dl className="meta-list">
              <div className="meta-row">
                <dt>File</dt>
                <dd title={filename}>{filename}</dd>
              </div>

              {confidence != null && (
                <div className="meta-row">
                  <dt>Confidence</dt>
                  <dd>
                    <ConfidenceBar value={confidence} />
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Text preview */}
          {text_preview && (
            <div className="preview-card">
              <h3 className="preview-title">Text Preview</h3>
              <p className="preview-body">{text_preview}</p>
            </div>
          )}

          {/* PDF iframe preview */}
          {isPdf && file && (
            <div className="pdf-preview-card">
              <h3 className="preview-title">Document Preview</h3>
              <iframe
                src={URL.createObjectURL(file)}
                title="PDF preview"
                className="pdf-iframe"
              />
            </div>
          )}
        </aside>

        {/* ── Right panel: extracted JSON ───────────────────────────── */}
        <section className="result-json">
          <h3 className="json-heading">Extracted Fields</h3>
          <JsonViewer data={data} />
        </section>
      </div>
    </div>
  );
}

/**
 * Small horizontal progress bar for the confidence score.
 */
function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const colour = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";

  return (
    <span className="confidence-bar-wrapper">
      <span
        className="confidence-bar-fill"
        style={{ width: `${pct}%`, background: colour }}
      />
      <span className="confidence-label">{pct}%</span>
    </span>
  );
}
