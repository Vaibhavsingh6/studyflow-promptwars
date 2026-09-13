# StudyFlow — AI-Powered Student Workspace

> **Lecture PDF &rarr; AI-generated revision notes + exactly 5-question practice quiz.**

StudyFlow is a purpose-built AI workspace for students designed around a single high-yield productivity workflow for the PromptWars Hackathon.

---

## The Problem

Students spend hours manually converting dense lecture slide decks, textbook chapters, and reading materials into actionable revision notes and self-testing practice questions before exams. This busywork is time-consuming, fragmented, and prone to passive memorization rather than active recall.

## The Solution

Upload one lecture PDF and StudyFlow extracts the text, prompts Google Gemini to analyze the material, validates the generated revision notes and practice quiz against a strict schema, and presents an interactive student study pack where learners can immediately answer questions, receive instant scoring feedback with explanations, and retake the quiz on demand.

---

## Core Workflow

```
1. Student Uploads PDF (Drag-and-Drop, <= 10 MB)
       │
       ▼
2. In-Memory Text Extraction (Server-side pdf-parse, no disk writes)
       │
       ▼
3. Gemini AI Analysis (gemini-2.0-flash with structured JSON output)
       │
       ▼
4. Strict Schema & Business Validation (Enforces exactly 5 questions & 4 options)
       │
       ▼
5. Revision Notes Display (Executive Summary + Key Takeaways & Concepts)
       │
       ▼
6. Interactive 5-Question Quiz (Question counter, option selection, submission guard)
       │
       ▼
7. Instant Scoring & Retake (Color-coded score, AI explanations, zero-reparse retake)
```

---

## AI Contribution

Google Gemini acts as a curriculum specialist and academic tutor:
- **Content Grounding**: Strictly constrained to the provided lecture text to prevent hallucinations or invented facts.
- **Executive Summary**: Synthesizes a high-yield 2–4 sentence overview of the lecture's core themes.
- **Key Takeaways**: Extracts punchy, numbered conceptual points optimized for exam revision.
- **Question Generation**: Formulates **exactly 5 multiple-choice questions**, each with **exactly 4 distinct options**, an indicated correct answer, and an educational explanation grounded in the text.
- **Structured JSON Mode**: Uses `responseMimeType: "application/json"` with temperature `0.2` for deterministic, rapid responses.

---

## Tech Stack

- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, Lucide React icons.
- **Backend API**: Node.js, Express 4, TypeScript 5, Multer (in-memory buffer storage).
- **AI Engine**: Google Gemini API (`gemini-2.0-flash` with automatic `gemini-1.5-flash` fallback).
- **PDF Extraction**: `pdf-parse` (isolated in-memory `Uint8Array` parsing).
- **Monorepo Tooling**: npm workspaces, `tsx` for TypeScript execution, `concurrently` for unified development.

---

## Security Guarantees

1. **Zero Client-Side Secrets**: Gemini API keys and credentials reside exclusively in the server environment (`process.env.GEMINI_API_KEY`). The client contains zero API keys or private tokens.
2. **In-Memory File Processing**: Multer uses `multer.memoryStorage()`. No uploaded files are ever written to disk, preventing filesystem traversal, symlink exploits, and disk exhaustion.
3. **Strict File Intake Bounds**: Both client and server validate the `application/pdf` MIME type and `.pdf` extension, enforcing a strict 10 MB maximum size limit.
4. **Input & Output Sanitization**: Text extraction requires at least 50 characters of readable text and truncates at 50,000 characters to prevent prompt-injection or context overflow attacks.
5. **AI Output Validation**: The server validates the AI response against a strict schema before sending data to the client, guaranteeing data integrity.
6. **Masked Server Errors**: Production error middleware never leaks raw stack traces, file paths, or internal error objects to the client.
7. **No Committed Secrets**: `.env` files are ignored via `.gitignore`; only placeholder templates (`.env.example`) exist in the repository.

---

## Automated Testing Suite

The repository features automated domain testing and compile-time type verification:
- **`npm test`**: Runs three verification stages:
  1. Server typecheck: `tsc --noEmit`
  2. Automated 15-test domain suite (`server/src/tests/fullSuite.test.ts`):
     - PDF extraction: valid PDF extraction (>50 chars), empty buffer rejection, insufficient text rejection.
     - Schema & business validation: valid JSON object parsing, stringified JSON parsing, malformed JSON rejection, missing title/summary rejection, empty key points rejection, question count enforcement (<5, >5), option count enforcement (<4), duplicate option rejection, correctAnswer mismatch rejection, and missing explanation rejection.
  3. Client typecheck: `tsc --noEmit`
- **`npm run build`**: Compiles the backend via `tsc` and bundles the frontend via Vite with zero warnings or errors.

---

## Project Structure

```
PromptWars/
├── package.json              # Root workspace orchestration & scripts
├── package-lock.json         # Pinned dependency tree
├── .gitignore                # Protects secrets (.env), dependencies, and builds
├── README.md                 # Complete project documentation
├── server/                   # Express + TypeScript API
│   ├── .env.example          # Server environment template
│   ├── tsconfig.json         # Server TypeScript configuration
│   ├── package.json          # Server dependencies & scripts
│   └── src/
│       ├── index.ts          # Server entry point & CORS configuration
│       ├── routes/
│       │   └── study.ts      # /api/health & /api/process-pdf endpoints
│       ├── middleware/
│       │   ├── upload.ts     # Multer memory storage (10 MB limit, PDF MIME check)
│       │   └── errorHandler.ts # Safe error sanitizer
│       ├── services/
│       │   ├── pdfExtractor.ts # In-memory text extraction via pdf-parse
│       │   ├── geminiService.ts# Gemini API client & prompt builder
│       │   └── validator.ts  # Strict JSON schema & business rule validator
│       ├── tests/
│       │   └── fullSuite.test.ts # 15-test automated test suite
│       └── types/            # Server TypeScript interface contracts
└── client/                   # React 18 + Vite 5 Single-Page Application
    ├── vite.config.ts        # Vite config with dev proxy (/api -> :5001)
    ├── tailwind.config.js    # Tailwind CSS styling configuration
    ├── postcss.config.js     # PostCSS configuration
    ├── tsconfig.json         # Client TypeScript configuration
    ├── vercel.json           # SPA rewrite configuration for Vercel
    ├── .env.example          # Client environment template
    ├── package.json          # Client dependencies & scripts
    └── src/
        ├── components/
        │   ├── Header.tsx       # Student navigation & live backend health badge
        │   ├── FileUpload.tsx   # Drag-and-drop PDF intake with ARIA live feedback
        │   ├── StudyPackView.tsx# Revision notes, 5-question quiz, scoring & retake
        │   └── StatusAlert.tsx  # Accessible status and error alerts
        ├── services/
        │   └── api.ts           # Configurable API client (local dev & production URL)
        ├── types/            # Client TypeScript interfaces
        ├── vite-env.d.ts     # Vite environment type declarations
        ├── App.tsx           # Application layout & 3-stage workflow stepper
        ├── index.css         # Tailwind base styles
        └── main.tsx          # React application root
```

---

## Environment Variables

### Backend (`server`)
- `GEMINI_API_KEY`: *(Required)* Google AI Studio Gemini API key.
- `PORT`: *(Optional)* Server port (defaults to `5001` or cloud host's `$PORT`).
- `NODE_ENV`: *(Optional)* Set to `production` in production environments.

### Frontend (`client`)
- `VITE_API_BASE_URL`: *(Optional)* Base URL of the deployed backend API (e.g. `https://studyflow-backend.onrender.com`). Leave empty for local development to use the built-in Vite dev proxy.

---

## Local Development

### 1. Install Dependencies
```bash
# Install all root and workspace dependencies
npm install
```

### 2. Configure Server Environment
```bash
# Copy server environment template
cp server/.env.example server/.env

# Add your Gemini API key to server/.env:
# GEMINI_API_KEY=your_actual_key_here
```

### 3. Run Development Servers
```bash
# Start both backend API (port 5001) and frontend dev server (port 3000) concurrently:
npm run dev
```
- **Frontend App**: `http://localhost:3000`
- **Backend Health Check**: `http://localhost:5001/api/health`

### 4. Run Verification & Build
```bash
# Run the complete test suite (server checks + 15 domain tests + client checks)
npm test

# Run the production build
npm run build
```

---

## Production Deployment

StudyFlow is designed for decoupled production deployment:
- **Frontend SPA**: Can be deployed to static edge hosting (e.g., Vercel, Netlify) with `client/vercel.json` providing Single-Page Application rewrites. Set `VITE_API_BASE_URL` to point to your deployed backend.
- **Backend API**: Deploy to a dedicated Node.js service (e.g., Render, Railway, Fly.io, or GCP Cloud Run). Set `GEMINI_API_KEY` in the hosting environment variables.
- **CORS Support**: The backend automatically accepts cross-origin requests from frontend hosts.

---

## Hackathon Alignment

StudyFlow is deliberately built around **ONE polished end-to-end workflow** rather than an expansive multi-tool platform:
- Eliminates busywork for students studying from lecture slides.
- Delivers an immediate, tangible result (revision notes + interactive 5-question comprehension check).
- Solves a real problem cleanly and reliably without unnecessary complexity.
