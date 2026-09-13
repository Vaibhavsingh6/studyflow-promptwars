# StudyFlow — AI-Powered Student Workspace

**PromptWars Hackathon MVP — Phase 1: Foundation & Architecture**

StudyFlow is a focused, high-yield workspace for students designed around one primary workflow:
**Lecture PDF &rarr; Concise Revision Notes + 5-Question Practice Quiz**.

---

## Architecture Overview

```
PromptWars/
├── package.json          # Root workspace orchestration
├── .gitignore            # Protects secrets (.env), dependencies, and builds
├── server/               # Minimal secure Node.js + Express + TypeScript API
│   ├── .env.example      # Example environment configuration
│   ├── tsconfig.json     # Server TypeScript configuration
│   └── src/
│       ├── index.ts      # Server entry point & CORS
│       ├── routes/
│       │   └── study.ts  # /api/health & /api/process-pdf endpoints
│       ├── middleware/
│       │   ├── upload.ts # Multer memory upload with 10MB limit & PDF MIME check
│       │   └── errorHandler.ts # Safe error sanitizer (no leaks)
│       └── types/        # TypeScript interfaces for API contracts
└── client/               # Clean React + TypeScript + Vite frontend
    ├── vite.config.ts    # Vite proxy (/api -> http://localhost:5001)
    ├── tailwind.config.js# Clean Tailwind theme
    └── src/
        ├── components/
        │   ├── Header.tsx       # Minimal student shell & backend status
        │   ├── FileUpload.tsx   # Accessible drag-and-drop PDF intake
        │   └── StatusAlert.tsx  # Accessible state alerts
        ├── services/
        │   └── api.ts           # Safe backend communication (no client secrets)
        ├── App.tsx              # Main layout & workflow tracker
        └── main.tsx             # React root mount
```

---

## Security Guarantees

1. **Zero Client-Side Secrets**: Gemini API keys and sensitive credentials remain exclusively server-side. No `VITE_` or `NEXT_PUBLIC_` environment variables are used.
2. **Strict File Intake Validation**:
   - Client-side checks MIME type and `.pdf` extension before upload.
   - Client-side validates file size (&le; 10 MB).
   - Server-side Multer middleware validates MIME type (`application/pdf`), `.pdf` extension, and enforces the 10 MB size limit in memory.
3. **Safe Error Sanitization**: Server-side error handling masks internal stack traces, system file paths, and environment details from the client.
4. **No Fake Responses**: Complies strictly with the hackathon specification; Phase 1 verifies and acknowledges PDF intake readiness without mocked AI responses.

---

## Quick Start

### 1. Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Configure Server Environment
```bash
cd server
cp .env.example .env
```
*(Optionally set `GEMINI_API_KEY` for Phase 2 preparation)*

### 3. Run Development Servers
```bash
# In terminal 1 (Server):
npm run dev:server

# In terminal 2 (Client):
npm run dev:client
```
Client: `http://localhost:3000`
Backend: `http://localhost:5001/api/health`

### 4. Build for Production
```bash
npm run build
```
