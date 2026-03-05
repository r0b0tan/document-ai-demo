import "./LineItemsTable.css";

export default function LineItemsTable({ items, currency }) {
  if (!items || items.length === 0) return null;
  const sample = items[0];
  if (typeof sample !== "object" || sample === null) return null;

  const cols = Object.keys(sample);

  return (
    <div className="li-wrapper">
      <table className="li-table">
        <thead>
          <tr>
            {cols.map((col) => (
              <th key={col} className="li-th">{fmtKey(col)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="li-row">
              {cols.map((col) => (
                <td key={col} className="li-td">
                  {fmtCell(item[col], col, currency)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmtKey(k) {
  return k.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtCell(val, col, currency) {
  if (val == null) return "—";
  const monetary = /price|amount|total|cost|fee|charge|rate/i.test(col);
  if (monetary && typeof val === "number") {
    return `${currency ? currency + " " : ""}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return String(val);
}
