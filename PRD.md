# CONTESTHON — Product Requirements Document (PRD)

**Event:** Kritical Hacks 2026 • AI/ML Student Track  
**Document Edition:** Clean, Readable Implementation Specification for Claude / LLM Agents  
**Project Name:** ContestHon (formerly EventSathi)  
**One-Sentence Product Definition:** ContestHon is a personalized opportunity assistant that discovers relevant opportunities across the live web, explains why they fit, and prepares applications while keeping final decisions in the student's hands.

---

## 1. Executive Summary

Students frequently miss hackathons, coding contests, workshops, fellowships, and research opportunities because event data is fragmented across various platforms and social channels. Eligibility rules, registration requirements, and deadlines are tedious to compare, and repetitive form-filling causes friction.

**ContestHon** consolidates opportunity discovery, personalized matching, deadline tracking, and assisted registration into a single end-to-end workflow:
- Continuously searches live web sources.
- Extracts structured event specifications without hallucinations.
- Calculates an explainable fit score against a student's profile.
- Prepares supported external registration forms for user review.

**Core Promise:** Spend less time searching and filling repetitive forms, and more time building and competing.

---

## 2. Product Vision & Objectives

### Vision
Democratize access to tech opportunities, making them simple to discover, evaluate, and act upon regardless of a student's institutional network.

### Objectives
1. **Live Discovery:** Aggregate real-time opportunities from diverse web sources using TinyFish Search & Fetch.
2. **Deterministic Extraction:** Parse dates, eligibility constraints, prize pools, team sizes, modes, and registration links into strict schemas. Unknown facts remain explicitly `null` / `unknown`.
3. **Transparent Matching:** Provide a 0–100% fit score with plain-text justification; hard eligibility constraints strictly veto incompatible events.
4. **Human-in-the-Loop Automation:** Pre-fill forms using verified student data with an explicit review stop prior to submission. Never auto-submit without user action.

---

## 3. Target Personas

| User Persona | Primary Needs & Pain Points |
| :--- | :--- |
| **College Student** | Discover relevant hackathons/contests; prevent missed deadlines. |
| **Beginner Participant** | Clear breakdown of eligibility, team requirements, and prerequisites. |
| **Active Builder / Hacker** | Filter by tech stack, prize pool, mode (online/in-person), and eliminate boilerplate forms. |
| **Club / Placement Cell (Future)** | Curate opportunity feeds and track campus engagement. |

---

## 4. System Architecture & Tech Stack

### Recommended Stack
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** Node.js + Express + TypeScript.
- **Auth & Database:** Firebase Auth (student accounts), Cloud Firestore (user profiles, events, applications).
- **Web Intelligence & Automation:** TinyFish API (Search, Fetch, Web Agent, Browser).
- **LLM / Schema Validation:** Structured LLM calls (e.g., Gemini/Claude with Zod schema validation).
- **Deployment:** Vercel (frontend) + Render / Railway (backend).

### Architectural Rules & Security
- **Backend Isolation:** All TinyFish API keys and orchestration logic reside exclusively on the Express backend. Never expose secrets to the frontend.
- **Untrusted Input Sanitation:** Treat all raw webpage HTML/text as untrusted data to guard against prompt injection.
- **Non-Hallucination Policy:** If a detail (prize, deadline, eligibility) is missing from source text, store as `null` or `"unknown"`. Never invent dates or requirements.

---

## 5. TinyFish Integration Specification

ContestHon leverages TinyFish capabilities strictly according to workflow requirements:

| Component | Responsibility | Output |
| :--- | :--- | :--- |
| **TinyFish Search API** | Query discovery based on user interests, categories, mode, and geography. | Candidate URLs + search metadata. |
| **TinyFish Fetch API** | Scrape clean text and DOM content from candidate URLs. | Raw page text for schema extraction. |
| **LLM + Schema Check** | Parse extracted text into typed JSON schema with validation. | Structured Event Record. |
| **TinyFish Web Agent** | Execute multi-step form preparation on target registration page. | Pre-filled form awaiting user review. |
| **TinyFish Browser** | Manage dynamic / JS-heavy rendering sessions where required. | Interactive browser session instance. |

### Official TinyFish Reference Endpoints
- Search API: `https://www.tinyfish.ai/search`
- Fetch API: `https://www.tinyfish.ai/fetch`
- Agent Service: `https://agent.tinyfish.ai/`
- Documentation: `https://docs.tinyfish.ai/`

---

## 6. Functional Requirements & Prioritization

### P0 (Core MVP — Hackathon Deliverable)
- **Student Profile:** Store user profile (name, college, year, branch, skills, interests, mode preference, city, team preference).
- **Live Discovery & Extraction:** Search via TinyFish Search, fetch page via TinyFish Fetch, parse structured JSON.
- **Eligibility & Fit Scoring:** Deterministic rule filter (hard pass/fail) + weighted fit algorithm.
- **Discovery Feed & Filters:** Filter by deadline, mode, prize, eligibility, and category.
- **Event Bookmarking:** Save and track interested events.
- **Registration Assistant:** Invoke Web Agent to fill fields on supported forms; pause before submission for user checkpoint.
- **Application Tracker:** State tracking across preparation steps without falsely asserting completion.

### P1 (Post-MVP / Nice to Have)
- Deadline calendar integration (Google Calendar / .ics export).
- Resume parser for auto-extracting skills with explicit user consent.

### Future
- Teammate matchmaking based on complementary skills.
- Institutional / club portal and analytics.

---

## 7. AI Matching & Scoring Algorithm

The matching algorithm decouples **hard constraints** from **soft relevance scoring**.

### Step 1: Hard Constraint Filter (Binary Gate)
If any hard constraint fails (e.g., student is 1st year but event is restricted to final year; or event is offline in Bengaluru and student is only online), the event is marked `ineligible = true` or `uncertain = true`. A high relevance score must never bypass an eligibility conflict.

### Step 2: Weighted Relevance Signal (0% – 100%)
For eligible events, compute a weighted composite score:

| Signal | Weight | Evaluation Criteria |
| :--- | :--- | :--- |
| **Eligibility & Constraints** | 35% | Completeness of match against rules, regions, and requirements. |
| **Skills & Interests** | 30% | Overlap between student's listed skills and event themes/tracks. |
| **Mode & Location** | 15% | Online vs. in-person alignment and geographic proximity. |
| **Timing & Availability** | 10% | Proximity of registration deadline vs. user availability. |
| **Personal Preferences** | 10% | Preference match on event format, prize size, and organizer. |

---

## 8. Data Model (Cloud Firestore Schema)

### Collection: `users/{userId}`
```typescript
interface UserProfile {
  userId: string;
  name: string;
  email: string;
  college: string;
  year: number; // e.g. 1, 2, 3, 4
  branch: string;
  skills: string[];
  interests: string[];
  preferredMode: 'online' | 'offline' | 'hybrid' | 'any';
  city: string;
  teamSizePreference: 'solo' | 'team' | 'any';
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

### Collection: `events/{eventId}`
```typescript
interface EventRecord {
  eventId: string;
  title: string;
  organizer: string;
  description: string;
  sourceUrl: string;
  registrationUrl: string;
  eligibility: {
    minYear?: number;
    maxYear?: number;
    allowedBranches?: string[];
    allowedColleges?: string[];
    rawEligibilityText: string;
    isRestricted: boolean;
  };
  startDate: string | null;
  deadline: string | null;
  mode: 'online' | 'offline' | 'hybrid';
  location: string | null;
  teamSize: {
    min: number;
    max: number;
  };
  prizes: string | null;
  tags: string[];
  extractedAt: string; // ISO 8601
  confidence: number; // 0.0 - 1.0
}
```

### Collection: `users/{userId}/savedEvents/{eventId}`
```typescript
interface SavedEvent {
  eventId: string;
  savedAt: string;
  personalNote?: string;
}
```

### Collection: `users/{userId}/applications/{applicationId}`
```typescript
interface ApplicationRecord {
  applicationId: string;
  eventId: string;
  status:
    | 'not_started'
    | 'preparing'
    | 'needs_user_input'
    | 'ready_for_review'
    | 'preparation_failed'
    | 'user_submitted'
    | 'confirmed';
  preparedFields: Record<string, string>;
  missingFields: string[];
  lastUpdatedAt: string;
  userConfirmedSubmission: boolean;
}
```

---

## 9. Registration Assistant Lifecycle & Guardrails

1. **User Initiation:** User clicks "Prepare Registration" on a supported event.
2. **Disclosure:** Modal displays target domain, form fields to be populated, and profile data used.
3. **Execution via TinyFish Web Agent:**
   - Populates standard fields (Name, Email, College, GitHub/LinkedIn links, Phone).
   - Flags missing or ambiguous questions as `needs_user_input`.
4. **Mandatory Checkpoint (No Auto-Submit):**
   - The agent strictly halts before pressing "Submit" or completing irreversible actions.
   - User reviews inputs in browser / preview mode.
5. **Fallback:** If blocked by CAPTCHA, authentication, or dynamic canvas forms, cleanly abort with a message: *"Requires manual completion: redirected to official URL."*
6. **Integrity Rule:** Status remains `ready_for_review` until the user checks `"I have completed submission"`, moving status to `user_submitted`.

---

## 10. UI & Frontend Specifications

### Key Views
1. **Dashboard:** Profile summary, top recommended matches with fit score badges, countdown timers for upcoming deadlines, active application status tracker.
2. **Explore & Filter:** Search bar, tag cloud (AI, Web3, Mobile, Open Source), sliders/checkboxes for mode, team size, deadline range. Cards feature direct source links.
3. **Event Detail View:** Complete breakdown of requirements, prizes, dates, source extraction freshness, and the "Prepare Application" action button.
4. **Registration Assistant Modal/Sidebar:** Step-by-step progress monitor, field mapping review table, and final manual handoff button.
5. **Saved & Applications Hub:** Tabular pipeline view (`Saved` -> `Preparing` -> `Review Ready` -> `Submitted`).

---

## 11. MVP Acceptance Criteria (Judge & Demo Ready)

- [ ] **Real Search:** TinyFish Search returns live opportunity URLs.
- [ ] **Real Extraction:** TinyFish Fetch retrieves content, LLM produces schema-valid JSON without hallucinating missing fields.
- [ ] **Transparency:** Every opportunity card displays a clickable source link and extraction timestamp.
- [ ] **Fit Explanations:** Fit score displays explicit rationale (e.g., *"Matched 3/4 skills: React, Python, ML; Open to all college years"*).
- [ ] **Assisted Registration Demo:** Demonstrates successful form population on at least 1 real supported event form.
- [ ] **Safety Guarantee:** Halts before submission; exposes zero API secrets to client bundle.
