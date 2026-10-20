# ContestHon — MVP (Kritical Hacks 2026)

ContestHon is an intelligent opportunity assistant for students that discovers hackathons, coding contests, and fellowships across the live web using TinyFish, scores them against the student's profile with deterministic and semantic AI matching, and prepares registration forms with a human-in-the-loop review checkpoint.

---

## 🚀 Quick Start

### 1. Start the Backend API (Port 3001)
```powershell
cd contesthon-backend
pnpm dev
# Or: npm start (runs compiled dist/index.js)
```

### 2. Start the Frontend Dev Server (Port 5173)
```powershell
cd contesthon-frontend
pnpm dev
```

Open **http://localhost:5173** in your browser.

---

## 🛠️ Tech Stack & Integrations

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS (Custom Design System) + Lucide Icons
- **Backend:** Node.js + Express + TypeScript
- **Web Intelligence:** TinyFish Search API & TinyFish Fetch API & Web Agent
- **AI Extraction & Summarization:** Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Authentication & Database:** Firebase Auth (Email/Password & Google Sign-in) + Cloud Firestore
- **Deterministic Fit Algorithm:** 2-step pipeline: Hard Constraint Gate (Year, Branch, Mode) + Weighted Relevance Scoring (Eligibility 35%, Skills 30%, Mode 15%, Timing 10%, Preferences 10%)

---

## 📂 Project Structure

```
Kritikal hack/
├── PRD.md                       # Complete PRD & technical specification
├── contesthon-backend/          # Express API server
│   ├── .env                     # Credentials (TinyFish, Gemini, Firebase)
│   ├── src/
│   │   ├── index.ts             # Express entry point
│   │   ├── config/firebase.ts   # Firestore initialization
│   │   ├── services/
│   │   │   ├── tinyfish.ts      # TinyFish Search, Fetch & Agent
│   │   │   ├── gemini.ts        # Gemini 1.5 Flash schema extractor
│   │   │   └── scoring.ts       # 2-step deterministic fit scoring
│   │   ├── routes/
│   │   │   ├── profile.ts       # User profile CRUD
│   │   │   ├── discover.ts      # Live discovery endpoint
│   │   │   ├── events.ts        # Event listings, search & bookmarks
│   │   │   └── applications.ts  # Form preparation & status tracker
│   │   └── types/index.ts       # Complete TypeScript interfaces
│   └── dist/                    # Compiled production build
└── contesthon-frontend/         # React SPA
    ├── .env                     # VITE_API_URL
    ├── src/
    │   ├── api/client.ts        # Axios API client
    │   ├── hooks/useAuth.ts     # Firebase Auth hook
    │   ├── components/
    │   │   ├── Layout.tsx       # Sidebar navigation & header
    │   │   ├── EventCard.tsx    # Opportunity card with fit badge
    │   │   ├── FitScoreBadge.tsx# Color-coded match badge
    │   │   ├── FilterPanel.tsx  # Search, mode & category filters
    │   │   └── RegistrationModal.tsx # Pre-filled review modal
    │   ├── pages/
    │   │   ├── AuthPage.tsx     # Sign-in / Sign-up / Google auth
    │   │   ├── ProfileSetup.tsx # Student profile & preferences
    │   │   ├── Dashboard.tsx    # Recommended feed & metrics
    │   │   ├── Explore.tsx      # Filterable event explorer
    │   │   ├── EventDetail.tsx  # Event view + fit breakdown
    │   │   ├── Saved.tsx        # Bookmarked opportunities
    │   │   └── Applications.tsx # Registration tracker pipeline
    │   └── types/index.ts       # Shared TypeScript schemas
    └── dist/                    # Production bundle
```

---

## 🔒 Security & Guardrails

- **Zero API Keys in Frontend:** All TinyFish and Gemini API secrets reside exclusively in `contesthon-backend/.env`.
- **Untrusted Input Sanitization:** Raw webpage HTML/text parsed as untrusted data to protect against prompt injection.
- **Strict Hallucination Policy:** Unknown fields (deadlines, prize amounts, eligibility rules) remain `null` or `"unknown"`.
- **Human-in-the-Loop Registration:** Form filling prepares and displays pre-populated fields for user verification; never auto-submits.
