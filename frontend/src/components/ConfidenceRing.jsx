import { useState, useEffect } from "react";
import "./ConfidenceRing.css";

const SIZE   = 14;
const STROKE = 1.5;
const R      = (SIZE - STROKE) / 2;
const CIRC   = 2 * Math.PI * R;

function ringColor(pct) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function ConfidenceRing({ value }) {
  const pct   = Math.round(value * 100);
  const color = ringColor(pct);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  const offset = CIRC * (1 - progress / 100);

  return (
    <span className="cr-wrap">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="cr-svg"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.65s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span className="cr-label" style={{ color }}>{pct}%</span>
    </span>
  );
}
