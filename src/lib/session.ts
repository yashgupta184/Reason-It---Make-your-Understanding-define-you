/**
 * In-Memory Session Store
 * 
 * Manages exam sessions during the demo lifecycle.
 * All exam data — questions, answers, keystroke events — is stored here.
 * 
 * For the MVP, in-memory storage is sufficient because:
 * - Sessions are ephemeral during a live demo
 * - Judges see the flow end-to-end in one session
 * - No persistence requirement for the hackathon
 */

import { ExamSession, Question, Answer, IntegrityFlag, IntegrityReport } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// Global session store — keyed by sessionId
const sessionStore: Map<string, ExamSession> = new Map()

/**
 * Create a new exam session.
 * Called by the educator after generating questions.
 */
export function createSession(
  studentAlias: string,
  questions: Question[]
): ExamSession {
  const sessionId = uuidv4()
  const session: ExamSession = {
    sessionId,
    studentAlias,
    questions,
    answers: [],
    startedAt: Date.now(),
    completedAt: null,
  }
  sessionStore.set(sessionId, session)
  return session
}

/**
 * Retrieve a session by ID.
 * Called by student exam page and report endpoints.
 */
export function getSession(sessionId: string): ExamSession | null {
  return sessionStore.get(sessionId) || null
}

/**
 * Add an answer to a session.
 * Called after the student submits their answer to a question.
 */
export function addAnswer(sessionId: string, answer: Answer): ExamSession | null {
  const session = sessionStore.get(sessionId)
  if (!session) return null

  // Check if an answer to this question already exists
  const existingIndex = session.answers.findIndex(a => a.questionId === answer.questionId)
  if (existingIndex >= 0) {
    // Update existing answer (e.g., after follow-up is added)
    session.answers[existingIndex] = answer
  } else {
    // Add new answer
    session.answers.push(answer)
  }

  sessionStore.set(sessionId, session)
  return session
}

/**
 * Mark a session as completed.
 * Called after the final integrity report is generated.
 */
export function completeSession(sessionId: string): ExamSession | null {
  const session = sessionStore.get(sessionId)
  if (!session) return null

  session.completedAt = Date.now()
  sessionStore.set(sessionId, session)
  return session
}

/**
 * Get the current answer count for a session.
 * Useful for determining which question the student is on.
 */
export function getAnswerCount(sessionId: string): number {
  const session = sessionStore.get(sessionId)
  return session ? session.answers.length : 0
}

/**
 * Get the next question index.
 * If all questions are answered, returns -1.
 */
export function getNextQuestionIndex(sessionId: string): number {
  const session = sessionStore.get(sessionId)
  if (!session) return -1

  const answerCount = session.answers.length
  return answerCount < session.questions.length ? answerCount : -1
}

/**
 * Get a specific question from a session.
 */
export function getQuestion(sessionId: string, questionIndex: number): Question | null {
  const session = sessionStore.get(sessionId)
  if (!session || questionIndex < 0 || questionIndex >= session.questions.length) {
    return null
  }
  return session.questions[questionIndex]
}

/**
 * Get the answer to a specific question.
 */
export function getAnswer(sessionId: string, questionId: string): Answer | null {
  const session = sessionStore.get(sessionId)
  if (!session) return null

  return session.answers.find(a => a.questionId === questionId) || null
}

/**
 * Update an answer with its follow-up response.
 * Called after the student answers the follow-up probe.
 */
export function updateAnswerFollowUp(
  sessionId: string,
  questionId: string,
  followUpAnswerText: string,
  analysis?: {
    consistencyScore: number
    keyPointsCovered: number
    complexityMismatch: boolean
    verdict: 'likely_genuine' | 'likely_assisted' | 'inconclusive'
    reasoning: string
  }
): Answer | null {
  const session = sessionStore.get(sessionId)
  if (!session) return null

  const answer = session.answers.find(a => a.questionId === questionId)
  if (!answer) return null

  answer.followUpAnswerText = followUpAnswerText
  if (analysis) {
    answer.consistencyScore = analysis.consistencyScore
    answer.keyPointsCovered = analysis.keyPointsCovered
    answer.complexityMismatch = analysis.complexityMismatch
    answer.verdict = analysis.verdict
    answer.reasoning = analysis.reasoning
  }
  sessionStore.set(sessionId, session)
  return answer
}

/**
 * Delete a session (useful for cleanup).
 * Not required for the demo but good practice.
 */
export function deleteSession(sessionId: string): boolean {
  return sessionStore.delete(sessionId)
}

/**
 * Get all sessions (for debugging or admin).
 * Not used in the demo but useful for verification.
 */
export function getAllSessions(): ExamSession[] {
  return Array.from(sessionStore.values())
}

/**
 * Clear all sessions (for testing or cleanup).
 */
export function clearAllSessions(): void {
  sessionStore.clear()
}
