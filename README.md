# Document AI Demo

A local, full-stack web application that uses an LLM (via Ollama) to understand documents. Upload a PDF, image, XML, or plain-text file and get back a classified document type and structured JSON fields — all without sending data to the cloud.

---

## What it does

```
document upload
      │
      ▼
 file-type detection
      │
      ▼
 text extraction
  ├── PDF      → pdfminer.six
  ├── image    → pytesseract (OCR)
  ├── XML      → ElementTree → flat text
  └── text     → UTF-8 decode
      │
      ▼
 classification (Ollama LLM)
  → invoice | resume | contract | letter | form | xml_document | unknown
      │
      ▼
 structured field extraction (Ollama LLM)
  → type-specific JSON schema filled in
      │
      ▼
 React UI displays result
```

---

## Project structure

```
document-ai-demo/
├── backend/
│   ├── main.py            FastAPI app + /analyze endpoint
│   ├── pipeline.py        Orchestrates the processing stages
│   ├── classify.py        LLM-based document classification
│   ├── extract_fields.py  Per-type structured field extraction
│   ├── extract_pdf.py     PDF → text via pdfminer.six
│   ├── extract_image.py   Image → text via pytesseract / OCR
│   ├── schemas.py         Pydantic response model
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── api.js
│       ├── index.css
│       └── components/
│           ├── Upload.jsx      Drag-and-drop file upload
│           ├── Upload.css
│           ├── ResultView.jsx  Two-column result layout
│           ├── ResultView.css
│           ├── JsonViewer.jsx  Syntax-highlighted JSON
│           └── JsonViewer.css
├── sample_documents/
│   ├── sample_invoice.xml
│   ├── sample_resume.txt
│   └── sample_contract.txt
└── README.md
```

---

## Requirements

| Dependency | Purpose |
|---|---|
| Python 3.10+ | Backend runtime |
| Node.js 18+ | Frontend build tooling |
| Ollama | Local LLM server |
| Tesseract OCR | Image text extraction (`pytesseract` wrapper) |

### Install Tesseract

**macOS:**
```bash
brew install tesseract
```

**Ubuntu / Debian:**
```bash
sudo apt install tesseract-ocr
```

**Windows:** Download the installer from https://github.com/UB-Mannheim/tesseract/wiki

---

## Setup

### 1. Ollama

Install Ollama from https://ollama.com and pull the default model:

```bash
ollama pull mistral
ollama serve          # starts the server on http://localhost:11434
```

The app also works with `llama3`, `phi3`, or `gemma` — selectable in the UI.

---

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

The API will be available at **http://localhost:8000**

Interactive docs: http://localhost:8000/docs

---

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The Vite dev server proxies `/analyze` and `/health` to the FastAPI backend automatically — no CORS config needed in development.

---

## API

### `POST /analyze`

Upload a document for analysis.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `file` | file | Document to analyse |
| `model` | string | Ollama model name (default: `mistral`) |

**Response:**

```json
{
  "filename": "invoice.pdf",
  "document_type": "invoice",
  "confidence": 0.95,
  "data": {
    "vendor": "Acme Software Solutions Ltd.",
    "invoice_number": "INV-2024-0042",
    "invoice_date": "2024-03-15",
    "total_amount": "7920.00",
    "currency": "USD",
    "line_items": []
  },
  "text_preview": "Invoice Number: INV-2024-0042 ..."
}
```

### `GET /health`

Returns `{"status": "ok"}` when the backend is running.

---

## Supported document types

| Type | Extracted fields |
|---|---|
| `invoice` | vendor, invoice_number, invoice_date, total_amount, currency, line_items |
| `resume` | name, email, phone, skills, companies, education |
| `contract` | parties, effective_date, termination_terms, governing_law |
| `letter` | sender, recipient, date, subject, summary |
| `form` | form_title, fields, submission_date |
| `xml_document` | root_element, namespaces, key_elements, summary |
| `unknown` | title, date, author, summary, key_entities |

---

## Supported file formats

| Format | Extraction method |
|---|---|
| PDF (`.pdf`) | pdfminer.six |
| JPEG / PNG / BMP / WebP | Tesseract OCR via pytesseract |
| XML (`.xml`) | ElementTree → flattened text |
| Plain text (`.txt`) | UTF-8 decode |

---

## Example workflow

1. Start Ollama: `ollama serve`
2. Start the backend: `uvicorn main:app --reload` (in `backend/`)
3. Start the frontend: `npm run dev` (in `frontend/`)
4. Open http://localhost:5173
5. Drag `sample_documents/sample_invoice.xml` onto the upload zone
6. Wait ~5–15 seconds for the LLM to process
7. View the detected type ("Invoice") and extracted fields on the right

---

## Configuration

| Setting | Where | Default |
|---|---|---|
| Ollama model | UI dropdown or `model` form field | `mistral` |
| Max upload size | `backend/main.py` `MAX_FILE_SIZE` | 20 MB |
| Classification text limit | `backend/classify.py` | 2000 chars |
| Extraction text limit | `backend/extract_fields.py` | 3000 chars |
| Text preview length | `backend/pipeline.py` | 500 chars |

---

## Development notes

- The backend imports use relative module names (no package), so run `uvicorn` from inside the `backend/` directory.
- Ollama must be running before the backend receives a request — the API call will raise a connection error otherwise.
- Image OCR quality depends heavily on image resolution; 150+ DPI scans work best.
- LLM responses are parsed with a lenient regex fallback to handle models that wrap JSON in markdown fences.
