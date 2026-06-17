# Project Understanding

## Problem Statement
Credentials from examinations are losing trust because AI can produce answers that look correct, which makes standard test scores unreliable. The project is not about catching cheating after the fact; it is about making exam outputs structurally resistant to AI-assisted credential inflation.

## Root Cause Analysis
- Traditional exams rely on identical or low-variance questions, so answers can be shared or generated once and reused.
- AI can generate plausible answers quickly, so detection-only systems are in a losing arms race.
- Proctoring systems focus on surveillance and privacy-invasive monitoring, which builds resentment and is not the core integrity signal.
- The real failure is that exams are designed for scoring memorization or output correctness, not for verifying live reasoning alignment.

## Core Insight
The core insight is that exam integrity is best preserved by combining:
- unique, equivalent question mutation per student,
- live comprehension verification via unexpected follow-up probes,
- behavioural signals from typing patterns, not cameras.

This turns credential verification from a passive detection problem into an active reasoning consistency problem.

## Intended Outcome
The project intends to prove that a student exam flow can generate unique question variants, capture answers with behavioural context, and produce an integrity report that exposes AI-assisted or copy-paste behaviour without invasive surveillance.

## User Journey
1. Educator enters a topic and requests exam generation.
2. System generates multiple unique yet equivalent questions for different student sessions.
3. Student opens their session link, answers a question, and receives a follow-up probe.
4. Student answers the probe and completes the session.
5. Educator views an integrity report with a risk score, flags, and a narrative summary.

## Stakeholders
- Educator: wants automatic integrity-aware exam creation and an actionable report.
- Student: wants a fair, privacy-respecting exam experience.
- Employer/Verifier: wants trust in the credential backed by evidence.
- Judges/Investors: want a live demo that proves the thesis quickly.

## Success Metrics
- Working end-to-end demo from educator to report.
- Visible question mutation: same topic but distinct questions.
- Follow-up probe appears during a student session.
- Report contains risk scores and flags based on data.
- Demo is deployable and live, supporting hackathon evaluation.

## Critical Demo Moments
- Educator screen shows generated unique variant questions.
- Student screen shows the follow-up probe appearing automatically after answer submission.
- Integrity report screen shows risk score, flags, and narrative with evidence-based language.

## Project Risks
- Gemini API failure or slow response could break the live demo.
- Overbuilding beyond the three core screens dilutes the demo.
- If the follow-up probe or report is not clearly visible, judges will miss the core thesis.
- Too much code complexity in a hackathon timeframe risks incomplete delivery.

## Features That Must Exist
- `src/types/index.ts` with shared data contracts.
- Educator panel for topic input and question generation.
- Student exam interface with typing capture and follow-up probe.
- In-memory session store or local state to persist exam flow.
- Integrity report with risk score, flags, and narrative.
- Gemini-backed API routes for question generation, follow-up analysis, and final report.

## Features That Must Not Exist
- Camera or biometric proctoring.
- Full user authentication or account management.
- Database setup or external persistent storage.
- A complex multi-page educator dashboard beyond question generation.
- Overly broad rubric, admin controls, or unnecessary admin analytics.
- Any feature that does not directly prove the credential integrity thesis.
