import { useState } from "react";
import "./JsonView.css";

export default function JsonView({ data }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="json-view">
      <div className="json-view-toolbar">
        <span className="json-view-label">JSON</span>
        <button className="json-copy-btn" onClick={handleCopy}>
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="json-pre-wrap">
        <pre
          className="json-pre"
          dangerouslySetInnerHTML={{ __html: highlight(json) }}
        />
      </div>
    </div>
  );
}

function highlight(json) {
  const safe = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return safe.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "jt-num";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "jt-key" : "jt-str";
      } else if (/true|false/.test(match)) {
        cls = "jt-bool";
      } else if (/null/.test(match)) {
        cls = "jt-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M20 6L9 17l-5-5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
