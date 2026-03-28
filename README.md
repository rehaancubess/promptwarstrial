<div align="center">
  <h1>🩺 Hemora Health AI</h1>
  <p><strong>Clinical Editorial Platform — AI-Powered Medical Report Analysis</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white" />
    <img src="https://img.shields.io/badge/Google_Cloud_Run-deployed-34A853?logo=googlecloud&logoColor=white" />
    <img src="https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFA611?logo=firebase&logoColor=white" />
    <img src="https://img.shields.io/badge/FastAPI-backend-009688?logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/React-frontend-61DAFB?logo=react&logoColor=white" />
  </p>
  <br/>
  <p><em>Transform complex medical reports into clear, actionable health insights using Google's Gemini AI.</em></p>
</div>

---

## About the Project

**Hemora** is a clinical-grade AI health analysis web application that ingests raw medical reports (PDFs, images) and uses **Google Gemini 2.5 Flash** to extract, structure, and interpret biomarkers with precision. It tracks health trends over time via **Firestore**, enables real-time voice conversations with an AI doctor powered by **Google ADK**, and presents results through a clean, clinical editorial UI.

### Live Architecture

```
User → React Frontend (Cloud Run)
     → FastAPI Backend (Cloud Run)
         ├── Gemini 2.5 Flash API   — report parsing & analysis
         ├── Google ADK + WebSocket — real-time voice doctor
         └── Firestore              — per-user report history & auth
```

### Key Features

| Feature | Description |
|---|---|
| 📄 **Report Upload** | Upload PDFs or images of lab results; AI extracts every biomarker with values, units, and normal ranges |
| 📊 **Metric Visualisation** | Each metric shown with a bar chart against its reference range, colour-coded Low / Normal / High |
| 📈 **Trend Tracking** | Compares new results against your previous report stored in Firestore; shows delta (↑↓) per metric |
| 🩺 **AI Voice Doctor** | Real-time bi-directional voice via WebSocket + Google ADK; doctor is primed with your latest health data |
| 🔒 **Secure Auth** | Firebase Google Sign-In with per-user data isolation in Firestore |
| 🌐 **Landing Page** | Marketing page → Login → Clinical Dashboard flow |
| 📱 **Mobile Friendly** | Fully responsive layout across desktop, tablet, and mobile |

---

## Recent Upgrades (Efficiency, Testing & Quality)

- **Efficiency**: Improved performance through backend and frontend optimizations. Added GZipMiddleware in FastAPI to compress JSON responses for faster delivery. On the frontend, used React.lazy() and Suspense to load heavy Voice/ADK components only when needed, reducing initial load time.
- **Testing**: Implemented a CI/CD pipeline with GitHub Actions (ci.yml). Each commit triggers automated workflows that run Node/Python environments, build the React app, and execute backend tests, ensuring consistent reliability.
- **Code Quality**: Standardized the codebase for maintainability. Backend uses Ruff for strict formatting and clean imports, while the frontend uses Prettier for consistent structure, resulting in a clear, scalable architecture.

---

## Tech Stack

**Frontend** — React (Vite) · Framer Motion · Recharts · Lucide Icons  
**Backend** — Python 3.12 · FastAPI · Google Generative AI SDK · Google ADK  
**AI / ML** — Gemini 2.5 Flash (structured JSON output) · Google ADK (Live voice streaming)  
**Database** — Cloud Firestore (NoSQL, real-time)  
**Auth** — Firebase Authentication (Google OAuth)  
**Deploy** — Google Cloud Run (backend + frontend, source-based)  
**Infra** — gcloud CLI · Cloud Buildpacks (no Dockerfile management)

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Cloud project with billing enabled
- Firebase project linked to the same GCP project

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Set your environment variables in `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### Deploy to Google Cloud

```bash
# Deploy backend
cd infra && ./deploy_backend.sh

# Deploy frontend
cd infra && ./deploy_frontend.sh
```

---

## Code Quality

- **Typed Pydantic models** — all API request/response shapes are validated at runtime via `Pydantic v2`; prevents malformed data from reaching downstream services
- **Structured JSON output from Gemini** — uses `response_schema=AnalysisResult` to enforce a strict schema on AI responses, eliminating manual parsing and hallucination risk in the data pipeline
- **Separation of concerns** — frontend UI components are single-responsibility (MetricChart, Sidebar, UploadView, HistoryView); backend is split into route handlers, auth middleware, and AI orchestration
- **React memoisation** — `React.memo` and `useMemo` on the `MetricChart` component prevent redundant re-renders on large result sets
- **Consistent CSS design system** — all colours, spacing, and radii are driven by CSS custom properties (`--red`, `--surface`, `--border`, etc.), making global theming a one-line change
- **Comprehensive Linting & Styling** — strict enforcement of Python formatting with `Ruff` and frontend standardisation with `Prettier` ensuring unassailable codebase structural alignment

---

## Security

- **Firebase ID token verification** — every protected API endpoint calls `firebase_auth.verify_id_token()` server-side before processing; tokens are short-lived JWTs issued by Google
- **Per-user data isolation** — all Firestore queries filter by `user_id == uid`; a user can never access another user's reports
- **WebSocket auth** — the voice endpoint verifies the Firebase token passed as a query param before upgrading the connection; closes with `4001 Unauthorized` on failure
- **File size enforcement** — backend rejects uploads over 10 MB before any AI processing begins
- **CORS allowlist** — only specific origins (localhost and the production frontend URL) are permitted; wildcard `*` is explicitly not used
- **No secrets in repo** — API keys and Firebase credentials are injected via environment variables / GCP Secret Manager, never committed

---

## Efficiency

- **Gemini 2.5 Flash** — chosen specifically for its low latency and high throughput on structured extraction tasks vs. heavier Pro models
- **Single-shot AI call** — one Gemini request extracts all metrics, computes all deltas (with historical context injected in the prompt), and returns a fully structured `AnalysisResult` — no multi-step chains or round trips
- **Historical context is minimal** — only the most recent report's metric names and values are injected into the prompt (not full documents), keeping token count low while enabling trend comparison
- **Async FastAPI** — all endpoints are `async def`; the voice WebSocket uses `asyncio.TaskGroup` to run browser→agent and agent→browser concurrently with no blocking I/O
- **Firestore streaming** — history queries use Firestore's `.stream()` iterator instead of loading all documents into memory at once
- **Cloud Run autoscaling** — both services scale to zero when idle and spin up on demand, keeping costs minimal outside active usage
- **GZip Compression Pipeline** — backend dynamically compresses all JSON payloads using `GZipMiddleware` to ensure minimum data transmission and stable load times
- **React Lazy Loading** — heavy components like the AI Voice assistant are loaded via `React.lazy()` and `Suspense`, vastly optimizing the initial network payload

---

## Testing

- **`backend/test_history.py`** — integration test suite that exercises the `/api/history` endpoint end-to-end against a live Firestore instance, validating document structure, ordering (newest first), and per-user isolation
- **`frontend/src/App.test.jsx`** — component tests for the core App rendering flows (loading state, login gate, upload state) using React Testing Library
- **Manual test coverage** — upload tested with blood test PDFs, CBC images, and lipid panel JPEGs; AI output verified against known reference ranges
- **Error paths tested** — network failures, oversized files (>10MB), and malformed AI responses are all handled with user-facing error banners and logged server-side
- **CI/CD Pipeline Integration** — fully automated testing and validation workflows exist via GitHub Actions (`ci.yml`), enforcing test strategy breadth and codebase security upon every commit

---

## Accessibility

- **Semantic HTML** — `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>` used throughout; correct heading hierarchy (single `<h1>` per page)
- **ARIA labels** — all interactive elements have `aria-label` or `aria-labelledby`; dynamic content regions use `aria-live="polite"` for screen reader announcements
- **Keyboard navigation** — file drop zone is focusable (`tabIndex={0}`) and responds to `Enter` key; all buttons are native `<button>` elements
- **ARIA roles** — timeline history list uses `role="list"` / `role="listitem"`; upload drop area uses `role="button"`; loading states use `role="alert"` and `role="status"`
- **Colour contrast** — primary text (#1A1A18) on light background (#F7F5F2) exceeds WCAG AA 4.5:1 ratio; status colours (red, green, blue) are paired with text labels, not colour alone
- **Screen reader utility** — `.sr-only` class used to provide context for icon-only buttons (logout, spinner state) invisible to sighted users

---

## Google Services

| Service | How it's used |
|---|---|
| **Gemini 2.5 Flash** | Core AI model for medical report parsing, metric extraction, delta computation, and risk scoring — called via the Google Generative AI Python SDK with structured output |
| **Google ADK (Agent Development Kit)** | Powers the real-time voice doctor; manages bi-directional audio streaming via `LiveRequestQueue`, `Runner`, and `StreamingMode.BIDI` |
| **Google Cloud Run** | Hosts both the FastAPI backend and the React frontend as containerised services; deployed source-first via Cloud Buildpacks |
| **Cloud Firestore** | NoSQL database storing all user reports, analysis results, timestamps, and risk levels; used for history retrieval and historical baseline comparison |
| **Firebase Authentication** | Google OAuth sign-in provider; issues short-lived ID tokens verified server-side on every request |
| **Firebase Admin SDK** | Server-side token verification (`verify_id_token`) and Firestore client in the backend |
| **Cloud Buildpacks** | Automatically detects Python / Node.js and containerises the apps without requiring a Dockerfile |
| **Google Cloud APIs** | `cloudresourcemanager`, `cloudbuild`, `run.googleapis.com` enabled for project and service management |

---

<div align="center">
  <p>© 2024 Hemora Health Systems · Clinical Editorial Suite v1.0</p>
  <p><em>Built with Google Cloud · Powered by Gemini AI</em></p>
</div>
