# ExamGuard AI — MVP Architecture & Features

This document provides a technical map of the implemented features, directory locations, and component data flows in the completed ExamGuard AI MVP codebase.

---

## 📂 Codebase Folder Structure & Features

```
ReasonIt/
├── src/
│   ├── types/
│   │   └── index.ts                 ← 1. Data Contracts (Extended typescript contracts)
│   │
│   ├── lib/
│   │   ├── session.ts               ← 2. Ephemeral session manager (In-memory Map)
│   │   ├── scoring.ts               ← 3. Deterministic behavioural scoring algorithms
│   │   └── gemini.ts                ← 4. Gemini client initializer and prompts config
│   │
│   ├── app/
│   │   ├── page.tsx                 ← 9. Redesigned landing page (strategic context)
│   │   ├── layout.tsx               ← Base layout config and Tailwind styling
│   │   ├── globals.css              ← Tailwind CSS directives
│   │   │
│   │   ├── educator/
│   │   │   └── page.tsx             ← 10. Educator exam setup dashboard
│   │   │
│   │   ├── exam/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx         ← 11. Student timed client with keystroke tracker
│   │   │
│   │   ├── report/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx         ← 12. Educator integrity audit dashboard UI
│   │   │
│   │   └── api/
│   │       ├── session/
│   │       │   └── [sessionId]/
│   │       │       └── route.ts     ← 5. GET endpoint: retrieves active session
│   │       ├── generate-questions/
│   │       │   └── route.ts         ← 6. POST endpoint: creates sessions & variants
│   │       ├── submit-answer/
│   │       │   └── route.ts         ← 7. POST endpoint: logs answer & calculates telemetry
│   │       ├── generate-followup/
│   │       │   └── route.ts         ← 8. POST endpoint: runs follow-up evaluation
│   │       └── integrity-report/
│   │           └── route.ts         ← 9. POST endpoint: generates final audit report
```

---

## ⚡ Chronological Feature Descriptions & Interactions

### 1. Types Definitions (`src/types/index.ts`)
- **What it does**: Holds data interfaces binding the backend engine to the frontend screens. Defines types for `Question`, `KeystrokeEvent`, `Answer` (holds text + typing telemetry + optional AI consistency analysis logs), `ExamSession`, `IntegrityFlag`, and `IntegrityReport`.
- **Interactions**: Shared contract imported by every typescript module, page, and API route in the application.

### 2. In-Memory Session Store (`src/lib/session.ts`)
- **What it does**: Establishes a global `Map` acting as an ephemeral datastore for the duration of the demo. Manages active student exam papers, logged answers, captured keystroke timelines, and stored Gemini analysis results.
- **Interactions**: Called by all API routes (GET session details, POST submit-answer, POST generate-followup, and POST integrity-report) to fetch or update state.

### 3. Behavioural Anomaly Analytics (`src/lib/scoring.ts`)
- **What it does**: A set of deterministic helper functions mapping telemetry timings:
  - *Paste events*: Flagged by filtering keydowns for `'paste'` triggers.
  - *Typing Speed CPS*: If character count divided by answer duration (seconds) exceeds `20 CPS` (Suspicious).
  - *Gap Spikes*: If max pause between keystroke keys exceeds `5 seconds` and response length is substantial (`>200 characters`).
- **Interactions**: Imported by `/api/submit-answer` and `/api/integrity-report` to generate score points and telemetry flags.

### 4. Gemini Scaffolding & Prompt Engine (`src/lib/gemini.ts`)
- **What it does**: Initializes the Generative Model (`gemini-2.0-flash`) using local environment keys. Sets up production prompts for:
  - *Prompt 1 (Question Mutation)*: Generates N unique but equivalent question scenarios and follow-up probes.
  - *Prompt 2 (Comprehension Probing)*: Checks response consistency against original answers and key rubrics.
  - *Prompt 3 (Narrative Reporting)*: Summarizes flags into an educator action guide.
- **Interactions**: Utilized by `/api/generate-questions`, `/api/generate-followup`, and `/api/integrity-report` endpoints.

### 5. API Session Route (`src/app/api/session/[sessionId]/route.ts`)
- **What it does**: Exposes a `GET` endpoint retrieving the student's current session progress from the store map.
- **Interactions**: Called by the Student Exam client on page mount to load the corresponding mutated questions.

### 6. API Generate Questions Route (`src/app/api/generate-questions/route.ts`)
- **What it does**: Exposes a `POST` endpoint receiving topic, student count, and difficulty. Queries Gemini for variant questions, registers student sessions in the store map, and returns links.
- **Interactions**: Called by the Educator panel when launching an exam.

### 7. API Submit Answer Route (`src/app/api/submit-answer/route.ts`)
- **What it does**: Exposes a `POST` endpoint receiving answer text, timing, and keystrokes. Calculates the deterministic risk score and adds the answer to the session.
- **Interactions**: Called by the Student Exam client after submitting an answer to an original question.

### 8. API Generate Follow-up Route (`src/app/api/generate-followup/route.ts`)
- **What it does**: Exposes a `POST` endpoint receiving the follow-up response. Triggers Gemini consistency check, updates the stored answer with the consistency score/verdict/reasoning, and returns analysis to the client.
- **Interactions**: Called by the Student Exam page after submitting a follow-up response.

### 9. API Integrity Report Route (`src/app/api/integrity-report/route.ts`)
- **What it does**: Exposes a `POST` endpoint computing the combined risk score (telemetry timing + follow-up AI contradiction penalty), raises audit flags, triggers narrative generation, marks session as complete, and returns the final report payload.
- **Interactions**: Called by the educator audit review page on mount.

### 10. Landing Page Client (`src/app/page.tsx`)
- **What it does**: Renders a dark, radial gradient landing page detailing the strategic context of credential trust and presenting navigation routes.
- **Interactions**: User entry point. Renders CTA directing to `/educator`.

### 11. Educator Dashboard Client (`src/app/educator/page.tsx`)
- **What it does**: Panel for test configuration. Renders a preview grid showing the generated mutated questions, concepts, follow-ups, and copyable unique student links.
- **Interactions**: Fetches from `/api/generate-questions`. Distributes links to student exam screens.

### 12. Student Exam Interface Client (`src/app/exam/[sessionId]/page.tsx`)
- **What it does**: Timed, tracked test client. Captures silent telemetry events on keydowns and pastes. Submits answers, prompts unexpected follow-up probes dynamically, and handles completion transitions.
- **Interactions**: Fetches details from `/api/session`, submits answers to `/api/submit-answer`, and handles follow-up reviews at `/api/generate-followup`.

### 13. Integrity Report Dashboard Client (`src/app/report/[sessionId]/page.tsx`)
- **What it does**: High-fidelity dashboard visualizing audit metrics. Features a circular overall risk score ring, AI narrative summaries, interactive hover timeline nodes, and expandable details cards comparing original vs follow-up responses alongside speed graphs and flags.
- **Interactions**: Fetches from `/api/session` and `/api/integrity-report`.
