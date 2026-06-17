# ExamGuard AI — Project Brief
### FAR AWAY Hackathon | Examinations Domain | Round 1 Submission

> **The one message:** We are not building a proctoring tool. We are rebuilding the global trust infrastructure for human credentials in the age of AI — starting with examinations.

---

## 1. Strategic Context

### Why This Domain
Five domains were available. Examinations was chosen over all others for these specific reasons:

- **Agentic & Autonomous**: 40–60% of all teams will pick this. Differentiation is near-impossible.
- **Railways / Space / Logistics**: Require hardware, real sensor data, or fleet access. Cannot demo credibly online.
- **Examinations**: 100% software, AI-native, browser-deployable, and the problem is on fire globally right now.

### The Real Problem (Not "Exam Cheating")
Credentials have lost their meaning — globally. When any student with a smartphone can pass any standardised test using AI, the credential that test produces is worthless. Employers, universities, and governments can no longer trust paper qualifications.

This is not an Indian problem. It is a civilisational infrastructure problem.

**Scale:**
- 1.8 billion students assessed annually via standardised testing worldwide
- 73% of universities globally report increased suspicion of AI-assisted submissions since 2023
- $8.5B global EdTech assessment market by 2027 — still dominated by legacy systems built in the 1900s

### India as Proof of Scale, Not Ceiling
India has the world's most demanding examination infrastructure — 2.4 crore JEE registrations, 13 million UPSC aspirants, multiple languages, extreme socioeconomic diversity. If you solve exam integrity here, at this scale, you have solved it for every exam board on earth. Every other country's problem is a smaller version of this.

**Never say**: "We are building this for India."
**Always say**: "We are proving this at India's scale. The deployment is global from day one."

---

## 2. Solution: ExamGuard AI

### Core Insight
Current tools try to **detect** cheating after it happens. That is a losing arms race — AI tools improve faster than detection methods. The correct approach is to **design exams that are structurally resistant to AI assistance in the first place.**

### Three Pillars

**Pillar 1 — AI Question Mutation**
Every student receives a structurally equivalent but textually unique question set. Sharing answers becomes useless because no two exam papers are identical. The system generates N unique variants from one topic input — same concept coverage, completely different phrasing, numbers, and real-world context.

**Pillar 2 — Agentic Comprehension Verification**
After a student submits a major answer, an AI agent fires 1–2 follow-up micro-questions testing the same concept from a different angle. GPT or Gemini can answer a static question — it cannot simulate a student's live, consistent reasoning chain when probed unexpectedly. Inconsistency between the original answer and follow-up is the primary integrity signal.

**Pillar 3 — Behavioural Integrity Signals**
Keystroke timing, paste events, and answer-revision patterns form a behavioural baseline passively — no camera, no surveillance theatre. Anomalies (e.g. a 4,000-character answer typed in 8 seconds = paste event) flag AI-assisted responses without invading student privacy.

### Why This Is Not Existing Proctoring
Remote proctoring tools (Proctortrack, ExamSoft) are despised globally for being invasive and error-prone. ExamGuard does not use cameras. It does not watch the student — it watches the **reasoning pattern**. Dignified, privacy-respecting, and structurally superior.

---

## 3. Outcomes by Stakeholder

These are what you lead with in the presentation — not features.

| Stakeholder | Outcome |
|---|---|
| **Student** | Their credential means something again. Merit is verifiable, not gameable. Fairer competition. |
| **Educator** | Zero manual paper-setting overhead. Integrity is automated. Full audit trail per exam session. |
| **Employer / University** | They can trust the score attached to a name. Credential is backed by a verifiable integrity report. |
| **Government / Policy** | Public exams are defensible. No single paper to leak — because every paper is unique. |

---

## 4. Team Structure & Ownership

**Two members. Zero overlap. Clean ownership from day one.**

Define shared data contracts first (see Section 6) before either person writes a single line of feature code.

### Person A — AI Engine + Backend
Owns everything that happens on the server and with the LLM.

- Gemini API integration — question generation, mutation logic, follow-up probe system
- All Next.js API routes: `/api/generate-questions`, `/api/submit-answer`, `/api/generate-followup`, `/api/integrity-report`
- Behavioural telemetry processing — keystroke event analysis, anomaly scoring algorithm
- GitHub repo structure, README, architecture diagram, `.env` setup

### Person B — Frontend + Demo Experience
Owns everything the user sees and interacts with.

- Educator dashboard — topic input, question preview, exam launch
- Student exam interface — timed, clean, keystroke-tracked, follow-up probe display
- Integrity report UI — risk score, flags, answer vs follow-up side by side, narrative summary
- Presentation deck (15 slides max), demo script, live walkthrough preparation

### Coordination Rule
Person A exposes API routes. Person B consumes them. The only synchronisation point is the TypeScript interface file (`src/types/index.ts`). If both agree on the data shapes before building, integration requires zero back-and-forth.

---

## 5. Tech Stack

No alternatives. No debate during build time.

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Single repo, API routes + UI together. One Vercel deploy = live demo link. |
| Language | TypeScript throughout | Type-safe contracts between AI engine and UI. Catches integration errors early. |
| AI Layer | Gemini Pro via `@google/generative-ai` | Free tier sufficient for demo. Model-agnostic prompt design = easy swap at scale. |
| Styling | Tailwind CSS | Speed. No design system setup time. |
| Storage (MVP) | In-memory / localStorage | No database setup. Sessions are ephemeral for demo. Add Supabase in Round 2. |
| Deployment | Vercel (free tier) | One push = live URL. Judges click a link — no local setup instructions. |

### Initialisation Commands
```bash
npx create-next-app@latest examguard --typescript --tailwind --app --src-dir
cd examguard
npm install @google/generative-ai uuid
```

### Critical Security Rule
The Gemini API key must **never** appear in the GitHub repository.
- Add to `.env.local` only
- `.env.local` must be in `.gitignore` from commit one
- Expose via `GEMINI_API_KEY` environment variable on Vercel dashboard
- An exposed key signals carelessness to judges and will be scraped within hours

---

## 6. Shared Data Contracts

**Both team members define and commit this file before writing any feature code.**
Location: `src/types/index.ts`

```typescript
// The atomic unit of the entire system
interface Question {
  id: string
  originalConcept: string        // e.g. "Newton's Third Law"
  questionText: string           // the mutated, unique question
  expectedKeyPoints: string[]    // what a correct answer must demonstrate
  difficulty: 'foundational' | 'applied' | 'analytical'
  subject: string
  followUpQuestion: string       // shown after student submits their answer
  followUpExpectedKeyPoints: string[]
}

// One student's complete exam session
interface ExamSession {
  sessionId: string
  studentAlias: string           // no PII for demo — "Student A", "Student B"
  questions: Question[]
  answers: {
    questionId: string
    answerText: string
    followUpAnswerText: string
    timeToAnswer: number         // milliseconds
    keystrokes: KeystrokeEvent[]
  }[]
  startedAt: number
  completedAt: number | null
}

// What the educator sees at the end
interface IntegrityReport {
  sessionId: string
  overallRiskScore: number       // 0–100
  flags: {
    questionId: string
    flagType: 'paste_detected' | 'timing_anomaly' | 'followup_inconsistency' | 'clean'
    detail: string
    severity: 'low' | 'medium' | 'high'
  }[]
  summary: string                // AI-generated natural language narrative
}

interface KeystrokeEvent {
  timestamp: number
  type: 'keydown' | 'paste'
  gap: number                    // ms since last keystroke — spike = paste signal
}
```

---

## 7. AI Prompt Architecture

These are production-quality prompts. The quality of prompts is what separates ExamGuard from every other team using an LLM API. Do not simplify these during build.

### Prompt 1 — Question Mutation Engine
Used in: `POST /api/generate-questions`

```typescript
const QUESTION_GENERATION_PROMPT = (topic: string, numVariants: number) => `
You are an expert examination designer with deep knowledge of Bloom's Taxonomy.

Your task: Generate ${numVariants} structurally UNIQUE but conceptually EQUIVALENT 
questions on the topic: "${topic}"

Rules:
1. Every question must test the SAME core concept but use different scenarios, numbers, 
   phrasings, or real-world contexts. A student who copies another student's answer 
   verbatim must score zero.
2. Each question must require genuine understanding — not recall of a definition.
3. Include one follow-up micro-question per question. The follow-up must test whether 
   the student actually understands their own answer — not whether they can reproduce 
   information.
4. Tag each question with difficulty: foundational | applied | analytical

Return ONLY a valid JSON array. No markdown. No explanation. No preamble.
Schema: Question[] as defined:
[{ 
  "id": "uuid",
  "originalConcept": "string",
  "questionText": "string", 
  "expectedKeyPoints": ["string"],
  "difficulty": "applied",
  "subject": "${topic}",
  "followUpQuestion": "string",
  "followUpExpectedKeyPoints": ["string"]
}]
`
```

### Prompt 2 — Comprehension Verification
Used in: `POST /api/generate-followup` (after student submits answer)

```typescript
const FOLLOWUP_ANALYSIS_PROMPT = (
  originalAnswer: string,
  followUpQuestion: string,
  followUpAnswer: string,
  expectedKeyPoints: string[]
) => `
You are assessing whether a student genuinely understands a concept or reproduced 
an AI-generated answer.

Original answer: "${originalAnswer}"
Follow-up question: "${followUpQuestion}"
Student's follow-up response: "${followUpAnswer}"
Expected key points: ${JSON.stringify(expectedKeyPoints)}

Analyse:
1. Does the follow-up answer show conceptual continuity with the original?
   (Genuine students are consistent. AI-generated answers often contradict 
   themselves when probed from a different angle.)
2. Does the follow-up hit expected key points in the student's own words?
3. Is there a vocabulary or complexity mismatch between original and follow-up?
   (Suggests original was AI-generated, follow-up was the student's real voice.)

Return ONLY valid JSON. No markdown.
{
  "consistencyScore": 0-100,
  "keyPointsCovered": 0-100,
  "complexityMismatch": true | false,
  "verdict": "likely_genuine" | "likely_assisted" | "inconclusive",
  "reasoning": "one sentence explanation"
}
`
```

### Prompt 3 — Integrity Report Narrative
Used in: `POST /api/integrity-report`

```typescript
const REPORT_SUMMARY_PROMPT = (flags: IntegrityReport['flags']) => `
You are writing an integrity summary for an educator reviewing exam results.
Be precise, non-accusatory, and evidence-based.

Flags detected: ${JSON.stringify(flags)}

Write a 2-3 sentence professional summary that:
1. States what was observed behaviourally (timing anomalies, paste events, 
   follow-up inconsistencies)
2. States the overall risk level: low / moderate / high
3. Recommends a specific next action:
   - "No action required"
   - "Oral follow-up recommended"
   - "Manual review required"

Do not accuse the student. Describe the signals. Let the educator decide.
Return plain text only. No JSON. No formatting.
`
```

---

## 8. File & Folder Structure

```
examguard/
├── src/
│   ├── types/
│   │   └── index.ts                  ← Shared contracts. Define first. Touch rarely.
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  ← Landing / entry point
│   │   │
│   │   ├── educator/
│   │   │   └── page.tsx              ← Person B: Educator dashboard
│   │   │
│   │   ├── exam/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx          ← Person B: Student exam interface
│   │   │
│   │   ├── report/
│   │   │   └── [sessionId]/
│   │   │       └── page.tsx          ← Person B: Integrity report UI
│   │   │
│   │   └── api/
│   │       ├── generate-questions/
│   │       │   └── route.ts          ← Person A: Gemini question generation
│   │       ├── submit-answer/
│   │       │   └── route.ts          ← Person A: Store answer + trigger follow-up
│   │       ├── generate-followup/
│   │       │   └── route.ts          ← Person A: Comprehension analysis
│   │       └── integrity-report/
│   │           └── route.ts          ← Person A: Final report + narrative
│   │
│   └── lib/
│       ├── gemini.ts                 ← Person A: Gemini client initialisation
│       ├── scoring.ts                ← Person A: Behavioural anomaly scoring logic
│       └── session.ts                ← Person A: In-memory session store (MVP)
│
├── .env.local                        ← NEVER commit. GEMINI_API_KEY lives here.
├── .gitignore                        ← Must include .env.local from commit one
└── README.md                         ← Person A: Setup instructions + demo link
```

---

## 9. MVP Screen Specification

**Three screens. No more.** A broken fourth screen is worse than a polished three.

### Screen 1 — Educator Panel (`/educator`)
**Purpose:** Demonstrate question mutation — the core innovation — immediately.

- Input: Topic (text field), Number of students (2–5 for demo), Difficulty selector
- Action: "Generate Exam" button calls `POST /api/generate-questions`
- Output: Side-by-side preview of 2–3 generated question variants
  - Judge sees immediately that questions on the same topic are structurally different
  - This is the first "wow moment" — do not bury it
- Secondary action: "Launch Exam" button generates a session link per student

**What the judge understands from this screen:** The question bank is not static. Every student gets a unique paper. Leaking answers is pointless.

### Screen 2 — Student Exam Interface (`/exam/[sessionId]`)
**Purpose:** Demonstrate the follow-up probe — the integrity mechanism.

- Timer visible (top right), questions one at a time
- Keystroke events captured silently (no UI indicator — it is passive)
- Student submits answer → brief "Analysing..." state (500ms) → follow-up probe appears
- Follow-up framed as: "One quick follow-up on your answer:" — not interrogative
- Student answers follow-up → next question or completion

**What the judge understands from this screen:** The system does not just record answers — it probes understanding. An AI-generated answer cannot survive an unexpected follow-up.

### Screen 3 — Integrity Report (`/report/[sessionId]`)
**Purpose:** Show the outcome — what the educator acts on.

- Overall risk score (0–100) displayed prominently with colour coding (green/amber/red)
- Per-question breakdown: original answer + follow-up answer side by side
- Flag badges per question: Paste Detected / Timing Anomaly / Follow-up Inconsistency / Clean
- AI-generated narrative summary (2–3 sentences, professional, non-accusatory)
- Timeline bar showing where anomalies occurred in the session

**What the judge understands from this screen:** The educator receives a structured, actionable integrity assessment — not a surveillance video or a binary pass/fail.

---

## 10. Behavioural Scoring Logic

Person A implements this in `src/lib/scoring.ts`. Keep it deterministic — no LLM call needed here.

```typescript
function computeRiskScore(session: ExamSession): number {
  let score = 0

  for (const answer of session.answers) {
    const { keystrokes, answerText, timeToAnswer } = answer

    // Signal 1: Paste detection
    const pasteEvents = keystrokes.filter(k => k.type === 'paste')
    if (pasteEvents.length > 0) score += 30

    // Signal 2: Timing anomaly
    // A genuine typist at 60 WPM types ~5 chars/sec
    // answerText.length / (timeToAnswer / 1000) > 20 chars/sec = suspicious
    const charsPerSecond = answerText.length / (timeToAnswer / 1000)
    if (charsPerSecond > 20) score += 25

    // Signal 3: Keystroke gap spike
    // Long gap followed by a large burst = likely copy-paste even if 'paste' not fired
    const gaps = keystrokes.map(k => k.gap)
    const maxGap = Math.max(...gaps)
    if (maxGap > 5000 && answerText.length > 200) score += 20
  }

  // Cap at 100
  return Math.min(score, 100)
}
```

The follow-up inconsistency score (from Prompt 2) is added separately to this base score by the `/api/integrity-report` route.

---

## 11. Presentation Structure

**15 slides maximum. 5 minutes total including live demo.**
Judges evaluate 100 teams. Concision is respect.

| # | Slide Content | Duration |
|---|---|---|
| 1 | The one-line problem. No product mention yet. | 20 sec |
| 2 | The scale — 1.8B students, AI disruption, why credentials are broken globally | 30 sec |
| 3 | Why current solutions fail — cameras are invasive, bans are inequitable | 20 sec |
| 4 | The insight — stop detecting cheating, design structurally uncheat-able exams | 20 sec |
| 5 | Three pillars — question mutation, follow-up probing, behavioural signals | 40 sec |
| 6–11 | Live demo — walk all three screens with real Gemini output | 90 sec |
| 12 | Global applicability — India as proof of scale, not ceiling | 20 sec |
| 13 | Outcomes per stakeholder — student, educator, employer, government | 20 sec |
| 14 | Scale-up roadmap — MVP → API licensing → government tender | 20 sec |
| 15 | The one message — rebuilding credential trust for the AI era | 10 sec |

### Opening Line (memorise this exactly)
> "India conducted over 2.4 crore JEE registrations in 2025. Gemini can score above the 90th percentile on JEE Mains in under 3 minutes. The current answer from exam boards is — ban phones. That is not a solution. Here is ours."

### Demo Rule
Design the follow-up probe appearing on screen as the primary "wow moment." When it appears — stop talking. Let it breathe for 3 seconds. Then say: "The student's answer triggered this automatically. No human intervention. No camera. The system just asked the one question that separates understanding from imitation."

---

## 12. Scale-Up Roadmap (for judges)

Frame this in three stages. This tells judges you are thinking like founders, not students.

**Stage 1 — MVP (Now)**
Single institution. Educator creates exam. Students sit it. Integrity report generated. Gemini free tier. Vercel deployment. Zero operational cost.

**Stage 2 — API Product (Post-hackathon)**
Any institution integrates ExamGuard via REST API. Bring-your-own LLM key. Usage-based pricing. Target: coaching institutes, private universities, online certification platforms.

**Stage 3 — Government Infrastructure (12–24 months)**
Tender for public examination boards (CBSE, state boards, international equivalents). Language-agnostic deployment (Gemini supports 40+ languages). White-labelled integrity reports. Compliance-grade audit trails.

---

## 13. Judging Criteria — How ExamGuard Scores

Taken directly from the FAR AWAY judging criteria image.

| Criterion | How ExamGuard addresses it |
|---|---|
| **Innovation & Technical Depth** | Agentic follow-up loop + behavioural fingerprinting. No open-source tool combines structural mutation + live comprehension verification. |
| **Engineering Quality** | Modular Next.js architecture. TypeScript throughout. Clean API boundaries. Each module independently testable. |
| **Real-World Impact** | India: 90M+ competitive exams/year. Global: 1.8B students. The outcome — a credential that can be verified as AI-unassisted — is the exact gap employers are demanding. |
| **Scalability** | API-first design. Model-agnostic prompts. Language-agnostic. No hardware dependency. Deployable globally from day one. |
| **Design & UX** | Dignified student experience. No cameras. Calm, focused interface. Educator report is actionable — not a surveillance log. |
| **Execution Quality** | End-to-end working demo: educator creates → student takes → report generated. No broken flows. Live Vercel URL submitted with GitHub. |

### What FAR AWAY explicitly penalises (from their image)
- Idea-only submissions — your demo must run live
- PowerPoint-only startups — working code is mandatory
- Copy-paste solutions — original architecture required
- Fake demos — real Gemini API calls, not mocked responses
- Minimal-effort AI wrappers — the follow-up probe loop and behavioural scoring are non-trivial
- Lack of depth and execution — the report screen must be substantive

---

## 14. GitHub Repository Requirements

Per FAR AWAY rules, the repository must include:

- `README.md` — Project overview, problem statement, solution summary, setup instructions, live demo link
- Working source code with clear folder structure
- `.env.example` (with placeholder key names, never real keys)
- Architecture diagram (can be an image in `/docs` or embedded in README)
- Setup instructions that work — judges may attempt to run it

### README Structure
```markdown
# ExamGuard AI
> Rebuilding credential trust infrastructure for the age of AI.

## Problem
## Solution
## How It Works (3 steps)
## Tech Stack
## Local Setup
## Live Demo
## Architecture
## Team
```

Commit history must show iterative work. One giant commit the night before signals cramming. Make meaningful commits throughout the build.

---

## 15. Non-Negotiables

These are the decisions that are final. Do not revisit them during build.

1. **Vercel deployment is mandatory.** Judges will not run your project locally.
2. **Real Gemini API calls in the demo.** No mocked responses. If the API fails during demo, have a recorded backup video.
3. **Three screens only.** Resist the urge to add features. Depth beats breadth.
4. **TypeScript interfaces defined before any feature code.** If this step is skipped, integration will break.
5. **No database for MVP.** In-memory session store is sufficient. Do not lose hours on Supabase setup.
6. **The follow-up probe must visibly appear on screen during the demo.** This is the single most important technical moment in the entire presentation.
7. **The problem frame is global.** Never say "for Indian students." Always say "starting with India's scale."

---

*Last updated: June 17, 2026 | FAR AWAY Hackathon — Round 1 Submission*
