import "./JsonViewer.css";

/**
 * Syntax-highlighted JSON viewer.
 *
 * Props:
 *   data: any   — value to display (will be JSON.stringify'd)
 */
export default function JsonViewer({ data }) {
  const pretty = JSON.stringify(data, null, 2);
  const highlighted = syntaxHighlight(pretty);

  return (
    <pre
      className="json-viewer"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

/**
 * Convert a JSON string to HTML with colour-coded spans.
 * Operates entirely on the serialised string — no eval / innerHTML user input.
 */
function syntaxHighlight(json) {
  // Escape HTML first to prevent injection
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-string";
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}
