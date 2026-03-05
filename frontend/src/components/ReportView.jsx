import { useState } from "react";
import KeyValueTable from "./FieldRenderers/KeyValueTable.jsx";
import TagList from "./FieldRenderers/TagList.jsx";
import LineItemsTable from "./FieldRenderers/LineItemsTable.jsx";
import ExperienceList from "./FieldRenderers/ExperienceList.jsx";
import "./ReportView.css";

/* ── Export helpers ──────────────────────────────────────────────── */
function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function jsonToXml(obj, root = "document") {
  function convert(key, val) {
    if (val === null || val === undefined) return `<${key}/>`;
    if (Array.isArray(val))
      return val.map((item) => convert("item", item)).join("\n");
    if (typeof val === "object")
      return `<${key}>\n${Object.entries(val).map(([k, v]) => convert(k, v)).join("\n")}\n</${key}>`;
    const escaped = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<${key}>${escaped}</${key}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(root, obj)}`;
}

/* ── Field lookup helpers ────────────────────────────────────────── */
function norm(key) {
  return key.toLowerCase().replace(/[\s_-]/g, "");
}

function get(data, ...keys) {
  if (!data || typeof data !== "object") return null;
  for (const k of keys) {
    const match = Object.keys(data).find((dk) => norm(dk) === norm(k));
    if (match !== undefined && data[match] !== undefined) return data[match];
  }
  return null;
}

function getAndMark(data, marked, ...keys) {
  for (const k of keys) {
    const match = Object.keys(data).find((dk) => norm(dk) === norm(k));
    if (match !== undefined && data[match] !== undefined) {
      marked.add(match);
      return data[match];
    }
  }
  return null;
}

function remaining(data, marked) {
  return Object.fromEntries(Object.entries(data).filter(([k]) => !marked.has(k)));
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHead({ title }) {
  return <h4 className="report-section-head">{title}</h4>;
}

/* ── Text block ──────────────────────────────────────────────────── */
function TextBlock({ text }) {
  if (!text) return null;
  return <p className="report-text-block">{text}</p>;
}

/* ═══════════════════════════════════════════════════════════════════
   Invoice report
═══════════════════════════════════════════════════════════════════ */
function InvoiceReport({ data }) {
  const m = new Set();

  const vendorName    = getAndMark(data, m, "vendor_name", "vendor", "seller", "company_name", "from", "biller");
  const vendorAddr    = getAndMark(data, m, "vendor_address", "seller_address", "from_address");
  const invoiceNum    = getAndMark(data, m, "invoice_number", "invoice_id", "number", "invoice_no", "reference");
  const invoiceDate   = getAndMark(data, m, "invoice_date", "date", "issue_date", "issued");
  const dueDate       = getAndMark(data, m, "due_date", "payment_due", "pay_by");
  const billTo        = getAndMark(data, m, "billing_to", "bill_to", "customer", "client", "to", "buyer");
  const currency      = getAndMark(data, m, "currency");
  const subtotal      = getAndMark(data, m, "subtotal", "sub_total", "net_amount", "net");
  const tax           = getAndMark(data, m, "tax_amount", "tax", "vat", "gst");
  const total         = getAndMark(data, m, "total_amount", "total", "amount_due", "grand_total");
  const lineItems     = getAndMark(data, m, "line_items", "items", "services", "products");
  const rest          = remaining(data, m);

  const vendorFields  = buildObj({ Name: vendorName, Address: vendorAddr });
  const invoiceFields = buildObj({ "Invoice #": invoiceNum, Date: invoiceDate, "Due Date": dueDate });
  const billFields    = typeof billTo === "object" && billTo !== null
    ? billTo
    : buildObj({ "Bill To": billTo });
  const curr = currency ? ` (${currency})` : "";
  const summaryFields = buildObj({
    [`Subtotal${curr}`]: subtotal,
    Tax: tax,
    [`Total${curr}`]: total,
  });

  return (
    <div className="report-sections">
      {keys(vendorFields)  && <Section title="Vendor"><KeyValueTable data={vendorFields} /></Section>}
      {keys(invoiceFields) && <Section title="Invoice Details"><KeyValueTable data={invoiceFields} /></Section>}
      {keys(billFields)    && <Section title="Bill To"><KeyValueTable data={billFields} /></Section>}
      {lineItems && Array.isArray(lineItems) && lineItems.length > 0 && (
        <Section title="Line Items">
          <LineItemsTable items={lineItems} currency={currency} />
        </Section>
      )}
      {keys(summaryFields) && (
        <Section title="Summary">
          <KeyValueTable data={summaryFields} highlight />
        </Section>
      )}
      {keys(rest) && <Section title="Additional Fields"><KeyValueTable data={rest} nested /></Section>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Resume report
═══════════════════════════════════════════════════════════════════ */
function ResumeReport({ data }) {
  const m = new Set();

  const name    = getAndMark(data, m, "name", "full_name", "candidate_name", "applicant");
  const email   = getAndMark(data, m, "email", "email_address", "e_mail");
  const phone   = getAndMark(data, m, "phone", "phone_number", "telephone", "mobile");
  const location = getAndMark(data, m, "location", "address", "city", "city_state");
  const summary  = getAndMark(data, m, "summary", "objective", "profile", "about", "bio");
  const skills   = getAndMark(data, m, "skills", "technical_skills", "technologies", "tools", "competencies");
  const exp      = getAndMark(data, m, "work_experience", "experience", "employment", "work_history", "jobs");
  const edu      = getAndMark(data, m, "education", "academic_background", "qualifications");
  const certs    = getAndMark(data, m, "certifications", "certificates", "credentials");
  const langs    = getAndMark(data, m, "languages");
  const rest     = remaining(data, m);

  return (
    <div className="report-sections">
      {/* Contact header */}
      <div className="resume-hero">
        {name && <div className="resume-name">{name}</div>}
        <div className="resume-contacts">
          {email    && <ContactChip icon={<IconEmail />}    text={email} />}
          {phone    && <ContactChip icon={<IconPhone />}    text={phone} />}
          {location && <ContactChip icon={<IconLocation />} text={location} />}
        </div>
      </div>

      {summary && <Section title="Summary"><TextBlock text={summary} /></Section>}

      {skills && (
        <Section title="Skills">
          <TagList items={Array.isArray(skills) ? skills : String(skills).split(",").map(s => s.trim())} />
        </Section>
      )}

      {exp && Array.isArray(exp) && exp.length > 0 && (
        <Section title="Experience"><ExperienceList items={exp} /></Section>
      )}

      {edu && (
        <Section title="Education">
          <ExperienceList items={Array.isArray(edu) ? edu : [edu]} compact />
        </Section>
      )}

      {certs && (
        <Section title="Certifications">
          <TagList items={Array.isArray(certs) ? certs : [certs]} />
        </Section>
      )}

      {langs && (
        <Section title="Languages">
          <TagList items={Array.isArray(langs) ? langs : [langs]} />
        </Section>
      )}

      {keys(rest) && <Section title="Additional Fields"><KeyValueTable data={rest} nested /></Section>}
    </div>
  );
}

function ContactChip({ icon, text }) {
  return (
    <span className="contact-chip">
      {icon}
      {text}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Contract report
═══════════════════════════════════════════════════════════════════ */
function ContractReport({ data }) {
  const m = new Set();

  const parties       = getAndMark(data, m, "parties", "party_names", "signatories", "contracting_parties");
  const effectiveDate = getAndMark(data, m, "effective_date", "start_date", "commencement_date", "date");
  const expiryDate    = getAndMark(data, m, "expiration_date", "termination_date", "end_date", "expiry");
  const govLaw        = getAndMark(data, m, "governing_law", "jurisdiction", "applicable_law");
  const termination   = getAndMark(data, m, "termination_clause", "termination", "cancellation");
  const keyTerms      = getAndMark(data, m, "key_terms", "main_terms", "terms", "obligations");
  const rest          = remaining(data, m);

  const datesFields = buildObj({
    "Effective Date": effectiveDate,
    "Expiration Date": expiryDate,
    "Governing Law": govLaw,
  });

  return (
    <div className="report-sections">
      {parties && (
        <Section title="Parties">
          <TagList items={Array.isArray(parties) ? parties : [parties]} variant="outlined" />
        </Section>
      )}

      {keys(datesFields) && (
        <Section title="Key Dates & Jurisdiction">
          <KeyValueTable data={datesFields} />
        </Section>
      )}

      {keyTerms && (
        <Section title="Key Terms">
          {typeof keyTerms === "string"
            ? <TextBlock text={keyTerms} />
            : Array.isArray(keyTerms)
              ? <TagList items={keyTerms} />
              : <KeyValueTable data={keyTerms} nested />
          }
        </Section>
      )}

      {termination && (
        <Section title="Termination">
          <TextBlock text={typeof termination === "string" ? termination : JSON.stringify(termination)} />
        </Section>
      )}

      {keys(rest) && <Section title="Additional Fields"><KeyValueTable data={rest} nested /></Section>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Letter report
═══════════════════════════════════════════════════════════════════ */
function LetterReport({ data }) {
  const m = new Set();

  const sender    = getAndMark(data, m, "sender", "from", "author");
  const recipient = getAndMark(data, m, "recipient", "to", "addressee");
  const date      = getAndMark(data, m, "date", "letter_date", "sent_date");
  const subject   = getAndMark(data, m, "subject", "re", "regarding");
  const tone      = getAndMark(data, m, "tone", "sentiment");
  const keyPoints = getAndMark(data, m, "key_points", "main_points", "highlights");
  const actions   = getAndMark(data, m, "action_items", "actions", "next_steps", "requests");
  const summary   = getAndMark(data, m, "summary", "abstract");
  const rest      = remaining(data, m);

  const headerFields = buildObj({ Sender: sender, Recipient: recipient, Date: date, Subject: subject, Tone: tone });

  return (
    <div className="report-sections">
      {keys(headerFields) && <Section title="Letter Details"><KeyValueTable data={headerFields} /></Section>}

      {summary && <Section title="Summary"><TextBlock text={summary} /></Section>}

      {keyPoints && Array.isArray(keyPoints) && keyPoints.length > 0 && (
        <Section title="Key Points">
          <TagList items={keyPoints} />
        </Section>
      )}

      {actions && Array.isArray(actions) && actions.length > 0 && (
        <Section title="Action Items">
          <TagList items={actions} variant="outlined" />
        </Section>
      )}

      {keys(rest) && <Section title="Additional Fields"><KeyValueTable data={rest} nested /></Section>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Analysis / Report document
═══════════════════════════════════════════════════════════════════ */
function AnalysisReport({ data }) {
  const m = new Set();

  const title       = getAndMark(data, m, "title", "report_title");
  const author      = getAndMark(data, m, "author", "prepared_by", "analyst");
  const date        = getAndMark(data, m, "date", "report_date", "published");
  const reportType  = getAndMark(data, m, "report_type", "type", "category");
  const execSummary = getAndMark(data, m, "executive_summary", "summary", "abstract", "overview");
  const findings    = getAndMark(data, m, "key_findings", "findings", "results", "conclusions");
  const recs        = getAndMark(data, m, "recommendations", "suggested_actions", "action_items");
  const dataPoints  = getAndMark(data, m, "data_points", "metrics", "statistics", "figures");
  const rest        = remaining(data, m);

  const headerFields = buildObj({ Title: title, Author: author, Date: date, Type: reportType });

  return (
    <div className="report-sections">
      {keys(headerFields) && <Section title="Report Details"><KeyValueTable data={headerFields} /></Section>}

      {execSummary && <Section title="Executive Summary"><TextBlock text={execSummary} /></Section>}

      {findings && Array.isArray(findings) && findings.length > 0 && (
        <Section title="Key Findings">
          <TagList items={findings} />
        </Section>
      )}

      {recs && Array.isArray(recs) && recs.length > 0 && (
        <Section title="Recommendations">
          <TagList items={recs} variant="outlined" />
        </Section>
      )}

      {dataPoints && Array.isArray(dataPoints) && dataPoints.length > 0 && (
        <Section title="Data Points">
          {dataPoints.every(dp => typeof dp === "object" && dp !== null)
            ? <LineItemsTable items={dataPoints} />
            : <TagList items={dataPoints} />
          }
        </Section>
      )}

      {keys(rest) && <Section title="Additional Fields"><KeyValueTable data={rest} nested /></Section>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Generic fallback
═══════════════════════════════════════════════════════════════════ */
function GenericReport({ data }) {
  return (
    <div className="report-sections">
      <section className="report-section">
        <KeyValueTable data={data} nested />
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Text preview accordion
═══════════════════════════════════════════════════════════════════ */
function TextPreviewAccordion({ text }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="text-accordion">
      <button className="text-accordion-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Text Preview</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <pre className="text-accordion-content">{text}</pre>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Stat chips
═══════════════════════════════════════════════════════════════════ */
function computeChips(document_type, data) {
  const chips = [];
  if (!data || typeof data !== "object") return chips;

  const fieldCount = Object.keys(data).length;
  if (fieldCount > 0) chips.push({ label: "Fields Extracted", value: fieldCount });

  if (document_type === "invoice") {
    const lineItems = get(data, "line_items", "items", "services", "products");
    if (Array.isArray(lineItems) && lineItems.length > 0)
      chips.push({ label: "Line Items", value: lineItems.length });

  } else if (document_type === "resume") {
    const skills = get(data, "skills", "technical_skills", "technologies", "tools", "competencies");
    const skillArr = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : null;
    if (skillArr && skillArr.length > 0)
      chips.push({ label: "Skills", value: skillArr.length });

    const exp = get(data, "work_experience", "experience", "employment", "work_history", "jobs");
    if (Array.isArray(exp) && exp.length > 0)
      chips.push({ label: "Companies", value: exp.length });

  } else if (document_type === "contract") {
    const parties = get(data, "parties", "party_names", "signatories", "contracting_parties");
    const partiesArr = Array.isArray(parties) ? parties : parties ? [parties] : null;
    if (partiesArr && partiesArr.length > 0)
      chips.push({ label: "Parties", value: partiesArr.length });

  } else if (document_type === "letter") {
    const keyPoints = get(data, "key_points", "main_points", "highlights");
    if (Array.isArray(keyPoints) && keyPoints.length > 0)
      chips.push({ label: "Key Points", value: keyPoints.length });
    const actions = get(data, "action_items", "actions", "next_steps");
    if (Array.isArray(actions) && actions.length > 0)
      chips.push({ label: "Action Items", value: actions.length });

  } else if (document_type === "report") {
    const findings = get(data, "key_findings", "findings", "results");
    if (Array.isArray(findings) && findings.length > 0)
      chips.push({ label: "Findings", value: findings.length });
    const recs = get(data, "recommendations", "suggested_actions");
    if (Array.isArray(recs) && recs.length > 0)
      chips.push({ label: "Recommendations", value: recs.length });
  }

  return chips;
}

function StatChips({ chips, loading, onExportJson, onExportXml }) {
  if (loading) {
    return (
      <div className="stat-chips">
        <span className="stat-chips-loading">Extracting fields…</span>
      </div>
    );
  }
  return (
    <div className="stat-chips">
      <div className="stat-chips-left">
        {chips.map(({ label, value }) => (
          <div key={label} className="stat-chip">
            <span className="stat-chip-label">{label}</span>
            <span className="stat-chip-value">{value}</span>
          </div>
        ))}
      </div>
      <div className="stat-chips-right">
        <button className="export-btn" onClick={onExportJson}>Export JSON</button>
        <button className="export-btn" onClick={onExportXml}>Export XML</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Root export
═══════════════════════════════════════════════════════════════════ */
const TYPED = ["invoice", "resume", "contract", "letter", "report"];

export default function ReportView({ result, loading }) {
  const { document_type, data, text_preview, filename } = result;
  const chips = computeChips(document_type, data);

  function exportJson() {
    downloadFile(JSON.stringify(result, null, 2), `${filename || "export"}.json`, "application/json");
  }

  function exportXml() {
    downloadFile(jsonToXml(result), `${filename || "export"}.xml`, "application/xml");
  }

  return (
    <div className="report-view">
      <StatChips chips={chips} loading={loading} onExportJson={exportJson} onExportXml={exportXml} />
      {document_type === "invoice"  && <InvoiceReport  data={data} />}
      {document_type === "resume"   && <ResumeReport   data={data} />}
      {document_type === "contract" && <ContractReport data={data} />}
      {document_type === "letter"   && <LetterReport   data={data} />}
      {document_type === "report"   && <AnalysisReport data={data} />}
      {!TYPED.includes(document_type) && <GenericReport data={data} />}

      {text_preview && <TextPreviewAccordion text={text_preview} />}
    </div>
  );
}

/* ── Shared helpers ──────────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <section className="report-section">
      <SectionHead title={title} />
      {children}
    </section>
  );
}

function buildObj(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

function keys(obj) {
  return obj && Object.keys(obj).length > 0;
}

/* ── Small inline icons ──────────────────────────────────────────── */
function IconEmail() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconLocation() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
