import "./LoadingSkeleton.css";

export default function LoadingSkeleton({ file, model }) {
  return (
    <div className="loading-skeleton">
      {/* Fake analysis header */}
      <div className="skel-header">
        <div className="skel-left">
          <div className="skel-block" style={{ width: 72, height: 22, borderRadius: 20 }} />
          <div className="skel-block" style={{ width: 1, height: 16, background: "var(--border)" }} />
          <div className="skel-block" style={{ width: 140 }} />
          <div className="skel-block" style={{ width: 56, height: 20, borderRadius: 10 }} />
        </div>
        <div className="skel-right">
          <div className="skel-block" style={{ width: 88, height: 6, borderRadius: 3 }} />
          <div className="skel-block" style={{ width: 88, height: 28, borderRadius: 6 }} />
          <div className="skel-block" style={{ width: 80, height: 28, borderRadius: 6 }} />
        </div>
      </div>

      {/* Fake workspace */}
      <div className="skel-body">
        {/* Left: data panel */}
        <div className="skel-panel skel-data">
          <div className="skel-tab-bar">
            <div className="skel-block" style={{ width: 64, height: 14 }} />
            <div className="skel-block" style={{ width: 48, height: 14 }} />
          </div>
          <div className="skel-fields">
            <div className="skel-block skel-section-head" />
            {[120, 180, 100, 220, 140, 90].map((w, i) => (
              <div key={i} className="skel-field-row">
                <div className="skel-block" style={{ width: 72 }} />
                <div className="skel-block" style={{ width: w }} />
              </div>
            ))}
            <div className="skel-block skel-section-head" style={{ marginTop: 20 }} />
            {[160, 130, 200].map((w, i) => (
              <div key={i} className="skel-field-row">
                <div className="skel-block" style={{ width: 72 }} />
                <div className="skel-block" style={{ width: w }} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: preview panel */}
        <div className="skel-panel skel-preview">
          <div className="skel-preview-placeholder" />
        </div>
      </div>

      {/* Status bar */}
      <div className="skel-status">
        <span className="skel-spinner" />
        <span className="skel-status-text">
          Analyzing <strong>{file?.name}</strong> with <strong>{model}</strong>&hellip;
        </span>
      </div>
    </div>
  );
}
