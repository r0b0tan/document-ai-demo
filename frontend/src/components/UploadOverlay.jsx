import { useRef, useState } from "react";
import "./UploadOverlay.css";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "text/plain",
  "application/xml",
  "text/xml",
];

const ACCEPTED_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.bmp,.webp,.txt,.xml";

export default function UploadOverlay({ onFileSelect, disabled, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging]   = useState(false);
  const [fileError, setFileError] = useState(null);

  function handleFile(f) {
    setFileError(null);
    if (!f) return;
    const ok =
      ACCEPTED_TYPES.includes(f.type) ||
      /\.(pdf|jpe?g|png|bmp|webp|txt|xml)$/i.test(f.name);
    if (!ok) {
      setFileError(`Unsupported file type: ${f.type || f.name}`);
      return;
    }
    onFileSelect(f);
  }

  function onDragOver(e) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function onDragLeave() { setDragging(false); }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  function onClick() {
    if (!disabled) inputRef.current?.click();
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0]);
    e.target.value = "";
  }

  const displayError = fileError || error;

  return (
    <div className="upload-overlay">
      <div className="upload-inner">
        <div className="upload-hero">
          <div className="upload-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--accent)" strokeWidth="1.5" />
              <path d="M7 8h10M7 12h7M7 16h5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="upload-headline">Analyze a document</h1>
          <p className="upload-subline">
            Upload a PDF, image, plain text, or XML file.<br />
            The model extracts structured data instantly.
          </p>
        </div>

        <div
          className={`drop-zone${dragging ? " drop-zone--drag" : ""}${disabled ? " drop-zone--disabled" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === "Enter" && onClick()}
          aria-label="Upload document"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="drop-primary">
            {dragging ? "Release to upload" : "Drag & drop a document"}
          </p>
          <p className="drop-secondary">or</p>
          <button className="browse-btn" type="button" disabled={disabled} tabIndex={-1}>
            Browse files
          </button>
          <p className="drop-hint">PDF · JPG · PNG · TXT · XML</p>
        </div>

        {displayError && (
          <div className="upload-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="var(--danger)" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {displayError}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={onInputChange}
          style={{ display: "none" }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
