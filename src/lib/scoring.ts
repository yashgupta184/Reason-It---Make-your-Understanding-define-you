/**
 * Behavioural Scoring Logic
 * 
 * Analyzes keystroke patterns and timing data to detect anomalies
 * indicative of AI-assisted or copy-pasted answers.
 * 
 * Three primary signals:
 * 1. Paste events — direct copy-paste from clipboard
 * 2. Typing speed anomalies — characters typed faster than a human can type
 * 3. Keystroke gap spikes — long pauses followed by sudden bursts = copy-paste
 * 
 * This logic is deterministic and requires no LLM calls.
 */

import { ExamSession, KeystrokeEvent } from '@/types'

export interface AnomalySignal {
  type: 'paste_detected' | 'timing_anomaly' | 'keystroke_gap_spike'
  severity: 'low' | 'medium' | 'high'
  detail: string
  points: number // contribution to risk score
}

/**
 * Analyze keystroke events for paste detection.
 * 
 * Return value indicates if a paste event was detected.
 */
export function detectPasteEvents(keystrokes: KeystrokeEvent[]): boolean {
  return keystrokes.some(k => k.type === 'paste')
}

/**
 * Analyze typing speed for anomalies.
 * 
 * A typical typist types 40-60 WPM = ~300-500 characters per minute = 5-8 chars/sec.
 * Threshold: >20 chars/sec = suspicious (likely pasted).
 * 
 * Returns { suspiciousSpeed: boolean, charsPerSecond: number }
 */
export function analyzeTypingSpeed(
  answerLength: number,
  timeMs: number
): { suspiciousSpeed: boolean; charsPerSecond: number } {
  const timeSec = Math.max(timeMs / 1000, 0.1) // avoid divide by zero
  const charsPerSecond = answerLength / timeSec

  // Threshold: >20 chars/sec is suspicious
  return {
    suspiciousSpeed: charsPerSecond > 20,
    charsPerSecond: Math.round(charsPerSecond * 10) / 10,
  }
}

/**
 * Analyze keystroke gaps for spikes.
 * 
 * A spike is: long gap (>5 seconds) followed by a large content burst (>200 chars).
 * This pattern suggests the student stepped away, returned, and pasted a large block.
 * 
 * Returns { spikeDetected: boolean, maxGap: number, maxGapMs: number }
 */
export function analyzeKeystrokeGaps(
  keystrokes: KeystrokeEvent[],
  answerLength: number
): { spikeDetected: boolean; maxGap: number; maxGapMs: number } {
  const gaps = keystrokes.map(k => k.gap)
  const maxGapMs = gaps.length > 0 ? Math.max(...gaps) : 0
  const maxGapSec = maxGapMs / 1000

  // Spike detected: gap >5 sec AND answer is substantial (>200 chars)
  const spikeDetected = maxGapSec > 5 && answerLength > 200

  return {
    spikeDetected,
    maxGap: Math.round(maxGapSec),
    maxGapMs,
  }
}

/**
 * Compute a base risk score for a single answer.
 * 
 * Scoring algorithm (from project brief):
 * - Paste event detected: +30 points
 * - Typing anomaly (>20 chars/sec): +25 points
 * - Keystroke gap spike (>5s + >200 chars): +20 points
 * - Cap at 100
 * 
 * Returns { baseScore: number, signals: AnomalySignal[] }
 */
export function computeAnswerRiskScore(
  answerText: string,
  timeToAnswer: number,
  keystrokes: KeystrokeEvent[]
): { baseScore: number; signals: AnomalySignal[] } {
  let score = 0
  const signals: AnomalySignal[] = []

  // Signal 1: Paste detection
  const hasPaste = detectPasteEvents(keystrokes)
  if (hasPaste) {
    score += 30
    signals.push({
      type: 'paste_detected',
      severity: 'high',
      detail: 'Paste event detected in keystroke history',
      points: 30,
    })
  }

  // Signal 2: Typing speed anomaly
  const { suspiciousSpeed, charsPerSecond } = analyzeTypingSpeed(
    answerText.length,
    timeToAnswer
  )
  if (suspiciousSpeed) {
    score += 25
    signals.push({
      type: 'timing_anomaly',
      severity: 'high',
      detail: `Answer typed at ${charsPerSecond} chars/sec (typical: 5-8 chars/sec)`,
      points: 25,
    })
  }

  // Signal 3: Keystroke gap spike
  const { spikeDetected, maxGap } = analyzeKeystrokeGaps(keystrokes, answerText.length)
  if (spikeDetected) {
    score += 20
    signals.push({
      type: 'keystroke_gap_spike',
      severity: 'medium',
      detail: `Large keystroke gap (${maxGap}s) followed by substantial content burst`,
      points: 20,
    })
  }

  // Cap score at 100
  const baseScore = Math.min(score, 100)

  return { baseScore, signals }
}

/**
 * Compute overall session risk score.
 * 
 * Aggregates base scores from all answers in the session.
 * Returns the average score across all answers.
 * 
 * If no answers yet, returns 0.
 */
export function computeSessionRiskScore(session: ExamSession): {
  overallScore: number
  scoreBreakdown: {
    questionId: string
    baseScore: number
  }[]
} {
  if (session.answers.length === 0) {
    return { overallScore: 0, scoreBreakdown: [] }
  }

  const breakdown = session.answers.map(answer => {
    const { baseScore } = computeAnswerRiskScore(
      answer.answerText,
      answer.timeToAnswer,
      answer.keystrokes
    )
    return {
      questionId: answer.questionId,
      baseScore,
    }
  })

  // Average score across all answers
  const totalScore = breakdown.reduce((sum, item) => sum + item.baseScore, 0)
  const overallScore = Math.round(totalScore / breakdown.length)

  return { overallScore, scoreBreakdown: breakdown }
}

/**
 * Generate a human-readable severity label for a risk score.
 */
export function getSeverityLabel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/**
 * Generate a colour class for UI display (Tailwind).
 */
export function getScoreColorClass(score: number): string {
  if (score >= 70) return 'bg-red-100 border-red-500 text-red-900'
  if (score >= 40) return 'bg-yellow-100 border-yellow-500 text-yellow-900'
  return 'bg-green-100 border-green-500 text-green-900'
}

/**
 * Validate keystroke data for sanity.
 * 
 * Returns true if the keystroke data appears valid.
 * Used for debugging or error handling.
 */
export function validateKeystrokeData(keystrokes: KeystrokeEvent[]): boolean {
  for (let i = 0; i < keystrokes.length; i++) {
    const k = keystrokes[i]
    if (typeof k.timestamp !== 'number' || k.timestamp < 0) return false
    if (k.type !== 'keydown' && k.type !== 'paste') return false
    if (typeof k.gap !== 'number' || k.gap < 0) return false
  }
  return true
}
