import { useMemo, useState } from "react";
import "./PreviewPanel.css";

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PreviewPanel({ file, result, collapsed, onExpand }) {
  const isPdf   = file?.type === "application/pdf";
  const isImage = file?.type?.startsWith("image/");
  const [zoom, setZoom]         = useState(1);
  const [fitWidth, setFitWidth] = useState(false);

  const objectUrl = useMemo(() => {
    if (file && (isPdf || isImage)) return URL.createObjectURL(file);
    return null;
  }, [file]);

  if (collapsed) {
    return (
      <div className="preview-panel preview-panel--collapsed">
        <button className="preview-expand-handle" onClick={onExpand} title="Show preview">
          <IconExpand />
          <span className="preview-expand-label">Preview</span>
        </button>
      </div>
    );
  }

  const fileType = isPdf ? "PDF" : isImage ? "Image" : "Text";

  function zoomIn() {
    setFitWidth(false);
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : z;
    });
  }

  function zoomOut() {
    setFitWidth(false);
    setZoom((z) => {
      const idx = ZOOM_LEVELS.indexOf(z);
      return idx > 0 ? ZOOM_LEVELS[idx - 1] : z;
    });
  }

  function handleFitWidth() {
    setFitWidth((v) => !v);
    setZoom(1);
  }

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <span className="preview-file-badge">{fileType}</span>
        <span className="preview-toolbar-sep" aria-hidden="true" />
        <span className="preview-toolbar-filename" title={result?.filename}>
          {result?.filename}
        </span>

        {isImage && (
          <div className="preview-zoom-controls">
            <button
              className="preview-zoom-btn"
              onClick={zoomOut}
              title="Zoom out"
              disabled={!fitWidth && zoom <= ZOOM_LEVELS[0]}
            >
              <IconMinus />
            </button>
            <span className="preview-zoom-level">
              {fitWidth ? "Fit" : `${Math.round(zoom * 100)}%`}
            </span>
            <button
              className="preview-zoom-btn"
              onClick={zoomIn}
              title="Zoom in"
              disabled={!fitWidth && zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            >
              <IconPlus />
            </button>
            <button
              className={`preview-fit-btn${fitWidth ? " active" : ""}`}
              onClick={handleFitWidth}
              title="Fit width"
            >
              <IconFitWidth />
            </button>
          </div>
        )}
      </div>

      <div className="preview-content">
        {isPdf && objectUrl && (
          <iframe
            src={objectUrl}
            title="PDF preview"
            className="preview-iframe"
          />
        )}

        {isImage && objectUrl && (
          <div className="preview-image-wrap">
            <img
              src={objectUrl}
              alt="Document preview"
              className="preview-image"
              style={fitWidth
                ? { width: "100%", height: "auto", maxWidth: "none", transform: "none" }
                : { transform: `scale(${zoom})`, transformOrigin: "top center" }
              }
            />
          </div>
        )}

        {!isPdf && !isImage && result?.text_preview && (
          <div className="preview-text-wrap">
            <pre className="preview-text">{result.text_preview}</pre>
          </div>
        )}

        {!isPdf && !isImage && !result?.text_preview && (
          <div className="preview-empty">
            <IconDoc />
            <span>No visual preview available</span>
            <span className="preview-empty-sub">Extracted text is shown in the Report tab</span>
          </div>
        )}
      </div>
    </div>
  );
}

function IconExpand() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconFitWidth() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
