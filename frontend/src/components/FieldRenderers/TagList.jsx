import "./TagList.css";

export default function TagList({ items, variant = "filled" }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`tag-list tag-list--${variant}`}>
      {items.map((item, i) => (
        <span key={i} className="tag">
          {typeof item === "object" ? JSON.stringify(item) : String(item)}
        </span>
      ))}
    </div>
  );
}
