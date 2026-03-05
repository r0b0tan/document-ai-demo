import ConfidenceRing from "./ConfidenceRing.jsx";
import "./AnalysisHeader.css";

const TYPE_META = {
  invoice:      { label: "Invoice",       color: "#4da3ff" },
  resume:       { label: "Resume / CV",   color: "#a78bfa" },
  contract:     { label: "Contract",      color: "#34d399" },
  letter:       { label: "Letter",        color: "#fb923c" },
  report:       { label: "Report",        color: "#f472b6" },
  form:         { label: "Form",          color: "#facc15" },
  xml_document: { label: "XML Document",  color: "#38bdf8" },
  unknown:      { label: "Unknown",       color: "#8b949e" },
};

export default function AnalysisHeader({ result, model, fieldCount, splitMode, onSplitChange, previewCollapsed, onTogglePreview }) {
  const { filename, document_type, confidence } = result;
  const meta = TYPE_META[document_type] ?? TYPE_META.unknown;

  return (
    <div className="analysis-header">

      {/* ── Left: stat boxes ────────────────────────── */}
      <div className="analysis-header-left">
        <div className="stat-box stat-box--primary" style={{ borderColor: meta.color + "50" }}>
          <span className="stat-label">Detected Type</span>
          <span className="stat-sep" style={{ background: meta.color + "40" }} />
          <span className="stat-value" style={{ color: meta.color }}>{meta.label}</span>
        </div>

        {model && (
          <div className="stat-box">
            <span className="stat-label">Model Used</span>
            <span className="stat-sep" />
            <span className="stat-value stat-model">{model}</span>
          </div>
        )}

        {confidence != null && (
          <div className="stat-box stat-box--conf">
            <span className="stat-label conf-label-wrap">
              Model Confidence
              <span
                className="conf-tooltip-anchor"
                aria-label="Confidence score estimated by the language model during document classification and structured data extraction."
              >
                <IconInfo />
                <span className="conf-tooltip">
                  Confidence score estimated by the language model during
                  document classification and structured data extraction.
                </span>
              </span>
            </span>
            <span className="stat-sep" />
            <span className="stat-value stat-conf-value">
              <ConfidenceRing value={confidence} />
            </span>
          </div>
        )}
      </div>

      {/* ── Center: filename ─────────────────────────── */}
      <div className="analysis-header-center">
        <span className="header-filename" title={filename}>{filename}</span>
      </div>

      {/* ── Right: display options ───────────────────── */}
      <div className="analysis-header-right">
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

function IconInfo() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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
