import "./AnalysisHeader.css";

const TYPE_META = {
  invoice:      { label: "Invoice",       color: "#4da3ff" },
  resume:       { label: "Resume / CV",   color: "#a78bfa" },
  contract:     { label: "Contract",      color: "#34d399" },
  letter:       { label: "Letter",        color: "#fb923c" },
  form:         { label: "Form",          color: "#facc15" },
  xml_document: { label: "XML Document",  color: "#38bdf8" },
  unknown:      { label: "Unknown",       color: "#8b949e" },
};

export default function AnalysisHeader({ result, fieldCount, splitMode, onSplitChange, previewCollapsed, onTogglePreview }) {
  const { filename, document_type, confidence } = result;
  const meta = TYPE_META[document_type] ?? TYPE_META.unknown;
  const pct  = confidence != null ? Math.round(confidence * 100) : null;
  const barColor = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="analysis-header">
      <div className="analysis-header-left">
        <span
          className="type-badge"
          style={{
            color: meta.color,
            background: meta.color + "18",
            borderColor: meta.color + "30",
          }}
        >
          {meta.label}
        </span>

        <span className="header-sep" aria-hidden="true" />

        <span className="header-filename" title={filename}>{filename}</span>

        {fieldCount > 0 && (
          <span className="fields-pill">{fieldCount} fields</span>
        )}
      </div>

      <div className="analysis-header-right">
        {pct != null && (
          <div className="confidence-widget">
            <div className="confidence-track">
              <div
                className="confidence-fill"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <span className="confidence-pct">{pct}%</span>
          </div>
        )}

        <div className="split-btns">
          <button
            className={`split-btn${!previewCollapsed && splitMode === "50-50" ? " active" : ""}`}
            onClick={() => { onSplitChange("50-50"); if (previewCollapsed) onTogglePreview(); }}
            title="50 / 50"
          >
            <IconSplit50 />
          </button>
          <button
            className={`split-btn${!previewCollapsed && splitMode === "70-30" ? " active" : ""}`}
            onClick={() => { onSplitChange("70-30"); if (previewCollapsed) onTogglePreview(); }}
            title="70 / 30"
          >
            <IconSplit70 />
          </button>
          <button
            className={`split-btn${previewCollapsed ? " active" : ""}`}
            onClick={() => { if (!previewCollapsed) onTogglePreview(); }}
            title="Full data"
          >
            <IconFull />
          </button>
        </div>

        <div className="header-divider" aria-hidden="true" />

        <button
          className="preview-toggle-btn"
          onClick={onTogglePreview}
          title={previewCollapsed ? "Show preview" : "Hide preview"}
        >
          {previewCollapsed ? <IconExpand /> : <IconCollapse />}
          <span>{previewCollapsed ? "Preview" : "Hide"}</span>
        </button>
      </div>
    </div>
  );
}

function IconSplit50() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
      <rect x="0.5" y="0.5" width="10" height="13" rx="1.5" stroke="currentColor" />
      <rect x="11.5" y="0.5" width="10" height="13" rx="1.5" stroke="currentColor" />
    </svg>
  );
}

function IconSplit70() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
      <rect x="0.5" y="0.5" width="14" height="13" rx="1.5" stroke="currentColor" />
      <rect x="15.5" y="0.5" width="6" height="13" rx="1.5" stroke="currentColor" />
    </svg>
  );
}

function IconFull() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
      <rect x="0.5" y="0.5" width="21" height="13" rx="1.5" stroke="currentColor" />
    </svg>
  );
}

function IconExpand() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 2v20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l4 2-4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCollapse() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 2v20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 10l-4 2 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
