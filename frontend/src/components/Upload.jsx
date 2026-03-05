import { useRef, useState } from "react";
import "./Upload.css";

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

/**
 * Drag-and-drop + click-to-browse file upload area.
 *
 * Props:
 *   onFileSelect(file: File) — called when a valid file is chosen
 *   disabled: boolean        — disables interaction during processing
 */
export default function Upload({ onFileSelect, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);

  function handleFile(file) {
    setError(null);
    if (!file) return;

    const ok =
      ACCEPTED_TYPES.includes(file.type) ||
      /\.(pdf|jpe?g|png|bmp|webp|txt|xml)$/i.test(file.name);

    if (!ok) {
      setError(`Unsupported file type: ${file.type || file.name}`);
      return;
    }

    onFileSelect(file);
  }

  // ── Drag handlers ────────────────────────────────────────────────
  function onDragOver(e) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  // ── Click handler ────────────────────────────────────────────────
  function onClick() {
    if (!disabled) inputRef.current?.click();
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0]);
    // Reset value so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="upload-wrapper">
      <div
        className={`upload-zone ${dragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        aria-label="Upload document"
      >
        <span className="upload-icon">📄</span>
        <p className="upload-primary">
          {dragging ? "Drop your document here" : "Drag & drop a document"}
        </p>
        <p className="upload-secondary">
          PDF, image (JPG/PNG), plain text, or XML
        </p>
        <button className="upload-btn" type="button" disabled={disabled} tabIndex={-1}>
          Browse files
        </button>
      </div>

      {error && <p className="upload-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={onInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />
    </div>
  );
}
