import "./TopBar.css";

export default function TopBar({ model, models, onModelChange, onReset, showReset, loading }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--accent)" strokeWidth="1.5" />
          <path d="M7 8h10M7 12h7M7 16h5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="topbar-title">Document AI</span>
      </div>

      <div className="topbar-right">
        <div className="model-control">
          <label className="model-label" htmlFor="model-select">Model</label>
          <select
            id="model-select"
            className="model-select"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={loading}
          >
            {models.map((m) => (
              <option
                key={m.name}
                value={m.name}
                disabled={!m.available}
              >
                {m.name}{!m.available ? " (unavailable)" : ""}
              </option>
            ))}
          </select>
        </div>

        {showReset && (
          <button className="topbar-btn" onClick={onReset} disabled={loading}>
            New Document
          </button>
        )}
      </div>
    </header>
  );
}
