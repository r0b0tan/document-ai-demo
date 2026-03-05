import "./ExperienceList.css";

export default function ExperienceList({ items, compact }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`exp-list${compact ? " exp-list--compact" : ""}`}>
      {items.map((item, i) => (
        <ExperienceItem key={i} item={item} compact={compact} />
      ))}
    </div>
  );
}

function ExperienceItem({ item, compact }) {
  const title = item.title || item.position || item.role || item.degree || item.program || item.field_of_study;
  const org   = item.company || item.organization || item.employer || item.institution || item.school || item.university;
  const dates = item.dates || item.duration || item.period ||
    [item.start_date, item.end_date].filter(Boolean).join(" — ");
  const desc  = item.description || item.responsibilities || item.achievements || item.details;

  return (
    <div className="exp-item">
      <div className="exp-item-header">
        <div className="exp-item-main">
          {title && <span className="exp-title">{title}</span>}
          {org   && <span className="exp-org">{org}</span>}
        </div>
        {dates && <span className="exp-dates">{dates}</span>}
      </div>

      {!compact && desc && (
        <p className="exp-desc">
          {Array.isArray(desc) ? desc.join(" · ") : desc}
        </p>
      )}
    </div>
  );
}
