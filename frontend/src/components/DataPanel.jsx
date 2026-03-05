import { useState } from "react";
import ReportView from "./ReportView.jsx";
import JsonView from "./JsonView.jsx";
import XmlView from "./XmlView.jsx";
import "./DataPanel.css";

export default function DataPanel({ result }) {
  const [activeTab, setActiveTab] = useState("report");

  return (
    <div className="data-panel">
      <div className="data-panel-header">
        <div className="data-tabs">
          <button
            className={`data-tab${activeTab === "report" ? " active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            <IconReport />
            Report
          </button>
          <button
            className={`data-tab${activeTab === "json" ? " active" : ""}`}
            onClick={() => setActiveTab("json")}
          >
            <IconCode />
            JSON
          </button>
          <button
            className={`data-tab${activeTab === "xml" ? " active" : ""}`}
            onClick={() => setActiveTab("xml")}
          >
            <IconXml />
            XML
          </button>
        </div>
      </div>

      <div className="data-panel-content">
        {activeTab === "report" && <ReportView result={result} />}
        {activeTab === "json"   && <JsonView data={result.data} />}
        {activeTab === "xml"    && <XmlView data={result.data} />}
      </div>
    </div>
  );
}

function IconReport() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCode() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M16 18l6-6-6-6M8 6L2 12l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconXml() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 2v7h7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 13l-2 2 2 2M15 13l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
