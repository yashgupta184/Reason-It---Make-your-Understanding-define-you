# Implementation Plan

## Overview
This implementation plan is the single source of truth. It is designed to prove the project outcome as quickly and reliably as possible while minimizing scope and risk.

## Phases
1. Definition and structure
2. Core engine and data flow
3. Demo flow and UI
4. Validation and polish
5. Deployment readiness

---

## Phase 1: Definition and structure
### Goal
Establish the minimal app structure, shared contracts, and the exact demo flow before writing the main code.

### Steps
1. Define shared data contracts in `src/types/index.ts`.
2. Create the app scaffold for the three screens and API routes.
3. Confirm the minimal page flow: `/educator`, `/exam/[sessionId]`, `/report/[sessionId]`.
4. Define in-memory session management and the API surface.

### Deliverables
- `src/types/index.ts`
- placeholder routes/pages for educator, exam, report, and APIs
- document in `implementation.md` of the exact flow and dependencies

### Validation Criteria
- Shared contract file exists and matches the brief.
- App route structure is present.
- No feature beyond the three screens and four API routes is included.

### Success Criteria
- Clear separation of engine vs UI.
- Minimal architecture that supports the core flow.

### Risks
- Overdesigning shared contracts.
- Creating page structure without a plan for data flow.

### Dependencies
- None beyond the Next.js app scaffold.

---

## Phase 2: Core engine and data flow
### Goal
Build the backend logic that proves question mutation, follow-up probing, and report scoring.

### Steps
1. Implement the in-memory session store.
2. Implement the behavioural scoring logic.
3. Implement `POST /api/generate-questions` with Gemini prompt scaffolding.
4. Implement `POST /api/generate-followup` or `/api/submit-answer` to analyse follow-up.
5. Implement `POST /api/integrity-report` to compute risk and return narrative.

### Deliverables
- `src/lib/session.ts`
- `src/lib/scoring.ts`
- `src/lib/gemini.ts` (Gemini client initializer)
- API route implementations

### Validation Criteria
- API routes return correct JSON shapes.
- Session store persists exam data in memory for the duration of the demo.
- Scoring and report generation follow the brief.

### Success Criteria
- The backend proves the core thesis independent of UI.
- The backend is stable enough for the student flow.

### Risks
- Gemini prompt formatting or response parsing errors.
- In-memory state losing data between API calls if architecture is wrong.

### Dependencies
- `@google/generative-ai` client package
- Environment variable for Gemini API key

---

## Phase 3: Demo flow and UI
### Goal
Build the three screens that realize the user journey and highlight the core product thesis.

### Steps
1. Implement `/educator` with topic input, difficulty, and generate button.
2. Display generated question variants and create student session links.
3. Implement `/exam/[sessionId]` with typed answer submission, follow-up probe, and keystroke capture.
4. Implement `/report/[sessionId]` with risk score, flags, and narrative.
5. Wire client-side fetch calls to the API.

### Deliverables
- Educator page
- Student exam page
- Report page
- Data flow tying UI to backend

### Validation Criteria
- All three screens function end-to-end.
- The follow-up probe is visible in the student flow.
- The report page shows scored flags and summary text.

### Success Criteria
- The demo can be shown in a short live walkthrough.
- The core message is obvious from the UI.

### Risks
- UI flow breaks due to missing session state.
- The follow-up probe gets skipped or hidden.

### Dependencies
- Completed API routes and session store

---

## Phase 4: Validation and polish
### Goal
Make the demo reliable, understandable, and judge-ready.

### Steps
1. Run the full app locally and verify the flow.
2. Add minimal UI polish and copy to make the narrative clear.
3. Create `README.md` and `.env.example`.
4. Add `.gitignore` with `.env.local`.
5. Confirm live deployment readiness.

### Deliverables
- polished UI copy and layout
- README with problem, solution, setup, and demo notes
- `.env.example`
- `.gitignore`

### Validation Criteria
- Local run is successful.
- README clearly describes the demo and requirements.
- No secret keys are committed.

### Success Criteria
- Judges can understand the product quickly.
- The repo is ready for public submission.

### Risks
- Rushing polish before functional validation.
- Missing environment configuration.

### Dependencies
- Completed core functionality and UI

---

## Phase 5: Deployment readiness
### Goal
Prepare the app for deployment and final demo.

### Steps
1. Ensure `GEMINI_API_KEY` is referenced only from environment.
2. Validate the app running on Vercel or a local production-like build.
3. Document deployment instructions.

### Deliverables
- deployment notes in `README.md`
- verified production build

### Validation Criteria
- `npm run build` succeeds.
- App is deployable without code changes.

### Success Criteria
- No blockers remain for a live demo.

### Risks
- API key leakage.
- Production build errors from app router or package issues.

### Dependencies
- Completed application and docs

---

## MVP Focus
- Must prove the thesis with question mutation, probe, and report.
- Must keep scope limited to the three screens and the four API routes.
- Must avoid proctoring, auth, database, and unnecessary analytics.

## Change Control
Any change beyond the core flow must be justified by how it strengthens the central demo outcome.
