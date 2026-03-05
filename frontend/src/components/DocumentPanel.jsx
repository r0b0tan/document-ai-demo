import "./DocumentPanel.css";

const TYPE_META = {
  invoice:      { label: "Invoice",       color: "#4da3ff" },
  resume:       { label: "Resume / CV",   color: "#a78bfa" },
  contract:     { label: "Contract",      color: "#34d399" },
  letter:       { label: "Letter",        color: "#fb923c" },
  form:         { label: "Form",          color: "#facc15" },
  xml_document: { label: "XML Document",  color: "#38bdf8" },
  unknown:      { label: "Unknown",       color: "#8b949e" },
};

export default function DocumentPanel({ result, file }) {
  const { filename, document_type, text_preview, confidence } = result;
  const meta = TYPE_META[document_type] ?? TYPE_META.unknown;
  const isPdf = file?.type === "application/pdf";

  return (
    <aside className="doc-panel">
      <div className="doc-header">
        <div className="doc-type-row">
          <span className="doc-type-badge" style={{ "--badge-color": meta.color }}>
            {meta.label}
          </span>
        </div>

        <p className="doc-filename" title={filename}>{filename}</p>

        {confidence != null && (
          <div className="doc-confidence">
            <span className="doc-confidence-label">Confidence</span>
            <ConfidenceBar value={confidence} />
          </div>
        )}
      </div>

      <div className="doc-preview">
        {isPdf && file ? (
          <iframe
            src={URL.createObjectURL(file)}
            title="PDF preview"
            className="doc-pdf-iframe"
          />
        ) : text_preview ? (
          <>
            <p className="doc-preview-heading">Text Preview</p>
            <p className="doc-preview-body">{text_preview}</p>
          </>
        ) : (
          <div className="doc-preview-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#1f2a36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" stroke="#1f2a36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>No preview available</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#4ade80" : pct >= 50 ? "#facc15" : "#f87171";

  return (
    <div className="confidence-bar-row">
      <div className="confidence-track">
        <div
          className="confidence-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="confidence-pct">{pct}%</span>
    </div>
  );
}
