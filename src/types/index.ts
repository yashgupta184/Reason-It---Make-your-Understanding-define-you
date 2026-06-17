/**
 * Shared Data Contracts for ExamGuard AI
 * 
 * This file defines the core TypeScript interfaces that bind the backend AI engine
 * and frontend UI together. Both team members must agree on these shapes before
 * writing any feature code.
 * 
 * Any change to these contracts requires discussion and coordination.
 */

/**
 * The atomic unit of the entire system.
 * A single unique question generated from a topic.
 */
export interface Question {
  id: string
  originalConcept: string // e.g. "Newton's Third Law"
  questionText: string // the mutated, unique question
  expectedKeyPoints: string[] // what a correct answer must demonstrate
  difficulty: 'foundational' | 'applied' | 'analytical'
  subject: string
  followUpQuestion: string // shown after student submits their answer
  followUpExpectedKeyPoints: string[]
}

/**
 * One keystroke or paste event during exam.
 * Used to detect copy-paste and typing speed anomalies.
 */
export interface KeystrokeEvent {
  timestamp: number // Unix timestamp
  type: 'keydown' | 'paste'
  gap: number // milliseconds since last keystroke — spike = paste signal
}

/**
 * One student's answer to a single question.
 * Includes the answer text and typing behavioural data.
 */
export interface Answer {
  questionId: string
  answerText: string
  followUpAnswerText: string
  timeToAnswer: number // milliseconds
  keystrokes: KeystrokeEvent[]
  consistencyScore?: number
  keyPointsCovered?: number
  complexityMismatch?: boolean
  verdict?: 'likely_genuine' | 'likely_assisted' | 'inconclusive'
  reasoning?: string
}

/**
 * One student's complete exam session.
 * The full record of a student taking an exam — questions, answers, timing.
 */
export interface ExamSession {
  sessionId: string
  studentAlias: string // no PII for demo — "Student A", "Student B"
  questions: Question[]
  answers: Answer[]
  startedAt: number // Unix timestamp
  completedAt: number | null // Unix timestamp, null if in progress
}

/**
 * Single flag raised during integrity analysis.
 * One anomaly detected per question.
 */
export interface IntegrityFlag {
  questionId: string
  flagType: 'paste_detected' | 'timing_anomaly' | 'followup_inconsistency' | 'clean'
  detail: string // human-readable description
  severity: 'low' | 'medium' | 'high'
}

/**
 * The final integrity report for an exam session.
 * What the educator sees at the end.
 */
export interface IntegrityReport {
  sessionId: string
  overallRiskScore: number // 0–100
  flags: IntegrityFlag[]
  summary: string // AI-generated natural language narrative
  generatedAt: number // Unix timestamp
}
