import "./KeyValueTable.css";

export default function KeyValueTable({ data, nested, highlight }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <table className={`kv-table${highlight ? " kv-table--highlight" : ""}`}>
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="kv-row">
            <td className="kv-key">{fmtKey(key)}</td>
            <td className="kv-value">{renderVal(value, nested)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function fmtKey(k) {
  return k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderVal(value, nested) {
  if (value === null || value === undefined) {
    return <span className="kv-null">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <span className={`kv-bool kv-bool--${value}`}>
        {value ? "Yes" : "No"}
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="kv-number">{value.toLocaleString()}</span>;
  }
  if (typeof value === "string") {
    return <span className="kv-string">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="kv-null">—</span>;
    if (value.every((v) => typeof v === "string" || typeof v === "number")) {
      return (
        <div className="kv-tags">
          {value.map((v, i) => (
            <span key={i} className="kv-tag">{v}</span>
          ))}
        </div>
      );
    }
    return (
      <div className="kv-nested">
        {value.map((v, i) => (
          <div key={i} className="kv-nested-item">
            {nested && typeof v === "object" ? (
              <KeyValueTable data={v} nested />
            ) : (
              <span className="kv-string">{String(v)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object" && nested) {
    return <KeyValueTable data={value} nested />;
  }
  return <span className="kv-string">{JSON.stringify(value)}</span>;
}
