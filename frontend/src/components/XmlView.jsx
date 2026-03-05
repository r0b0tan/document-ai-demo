import { useState } from "react";
import "./XmlView.css";

/* ── XML serializer ──────────────────────────────────────────────── */
function serializeNode(tag, value, depth) {
  const pad = "  ".repeat(depth);
  const safeTag = tag.replace(/[^a-zA-Z0-9_.-]/g, "_").replace(/^[^a-zA-Z_]/, "_");

  if (value === null || value === undefined) {
    return `${pad}<${safeTag} />`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<${safeTag} />`;
    const children = value.map((item) => serializeNode("item", item, depth + 1)).join("\n");
    return `${pad}<${safeTag}>\n${children}\n${pad}</${safeTag}>`;
  }

  if (typeof value === "object") {
    const children = Object.entries(value)
      .map(([k, v]) => serializeNode(k, v, depth + 1))
      .join("\n");
    return `${pad}<${safeTag}>\n${children}\n${pad}</${safeTag}>`;
  }

  const escaped = String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">");
  return `${pad}<${safeTag}>${escaped}</${safeTag}>`;
}

function toXml(data) {
  if (!data || typeof data !== "object") return `<?xml version="1.0" encoding="UTF-8"?>\n<document />`;
  const body = Object.entries(data)
    .map(([k, v]) => serializeNode(k, v, 1))
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n${body}\n</document>`;
}

/* ── Syntax highlighter ──────────────────────────────────────────── */
function highlight(xml) {
  const safe = xml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return safe
    // XML declaration
    .replace(
      /(&lt;\?xml[^?]*\?&gt;)/g,
      '<span class="xt-decl">$1</span>'
    )
    // Closing tags: </tag>
    .replace(
      /(&lt;\/)([\w.-]+)(&gt;)/g,
      '<span class="xt-punct">$1</span><span class="xt-tag">$2</span><span class="xt-punct">$3</span>'
    )
    // Self-closing tags: <tag />
    .replace(
      /(&lt;)([\w.-]+)(\s*\/&gt;)/g,
      '<span class="xt-punct">$1</span><span class="xt-tag">$2</span><span class="xt-punct">$3</span>'
    )
    // Opening tags: <tag>
    .replace(
      /(&lt;)([\w.-]+)(&gt;)/g,
      '<span class="xt-punct">$1</span><span class="xt-tag">$2</span><span class="xt-punct">$3</span>'
    );
}

/* ── Component ───────────────────────────────────────────────────── */
export default function XmlView({ data }) {
  const [copied, setCopied] = useState(false);
  const xml = toXml(data);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="xml-view">
      <div className="xml-view-toolbar">
        <span className="xml-view-label">XML</span>
        <button className="xml-copy-btn" onClick={handleCopy}>
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="xml-pre-wrap">
        <pre
          className="xml-pre"
          dangerouslySetInnerHTML={{ __html: highlight(xml) }}
        />
      </div>
    </div>
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
