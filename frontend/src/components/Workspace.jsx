import { useState } from "react";
import AnalysisHeader from "./AnalysisHeader.jsx";
import DataPanel from "./DataPanel.jsx";
import PreviewPanel from "./PreviewPanel.jsx";
import "./Workspace.css";

function countFields(data) {
  if (!data || typeof data !== "object") return 0;
  return Object.keys(data).length;
}

export default function Workspace({ result, file, model }) {
  const [splitMode, setSplitMode]               = useState("50-50");
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  const fieldCount = countFields(result?.data);

  const gridCols = previewCollapsed
    ? "1fr 40px"
    : splitMode === "70-30"
      ? "7fr 3fr"
      : "1fr 1fr";

  return (
    <div className="workspace">
      <AnalysisHeader
        result={result}
        model={model}
        fieldCount={fieldCount}
        splitMode={splitMode}
        onSplitChange={setSplitMode}
        previewCollapsed={previewCollapsed}
        onTogglePreview={() => setPreviewCollapsed((v) => !v)}
      />

      <div className="workspace-body" style={{ gridTemplateColumns: gridCols }}>
        <DataPanel result={result} />
        <PreviewPanel
          file={file}
          result={result}
          collapsed={previewCollapsed}
          onExpand={() => setPreviewCollapsed(false)}
        />
      </div>
    </div>
  );
}
