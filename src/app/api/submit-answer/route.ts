import { NextRequest, NextResponse } from 'next/server'
import { addAnswer, getSession } from '@/lib/session'
import { computeAnswerRiskScore } from '@/lib/scoring'
import { KeystrokeEvent, Answer } from '@/types'

/**
 * POST /api/submit-answer
 * 
 * Student exam flow:
 * 1. Student submits their answer to a question
 * 2. System stores the answer with behavioural data (keystroke events)
 * 3. System computes a base risk score
 * 4. Returns acknowledgment + asks for follow-up (if applicable)
 * 
 * Request body:
 * {
 *   "sessionId": "uuid",
 *   "questionId": "uuid",
 *   "answerText": "Newton's third law states...",
 *   "timeToAnswer": 45000,
 *   "keystrokes": [
 *     { "timestamp": 1623456789, "type": "keydown", "gap": 0 },
 *     { "timestamp": 1623456790, "type": "keydown", "gap": 150 },
 *     { "timestamp": 1623456900, "type": "paste", "gap": 3000 }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "baseRiskScore": 25,
 *   "anomalies": [ { type, severity, detail } ],
 *   "message": "Answer received. Now answer this follow-up..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, questionId, answerText, timeToAnswer, keystrokes } = body

    // Validate input
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    if (!questionId || typeof questionId !== 'string') {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      )
    }

    if (!answerText || typeof answerText !== 'string' || answerText.trim().length === 0) {
      return NextResponse.json(
        { error: 'answerText is required and must be non-empty' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(timeToAnswer) || timeToAnswer < 0) {
      return NextResponse.json(
        { error: 'timeToAnswer must be a non-negative integer (milliseconds)' },
        { status: 400 }
      )
    }

    if (!Array.isArray(keystrokes)) {
      return NextResponse.json(
        { error: 'keystrokes must be an array' },
        { status: 400 }
      )
    }

    // Retrieve session
    const session = getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      )
    }

    // Compute risk score for this answer
    const { baseScore, signals } = computeAnswerRiskScore(
      answerText,
      timeToAnswer,
      keystrokes as KeystrokeEvent[]
    )

    // Create answer record
    const answer: Answer = {
      questionId,
      answerText,
      followUpAnswerText: '', // Will be filled when student answers follow-up
      timeToAnswer,
      keystrokes: keystrokes as KeystrokeEvent[],
    }

    // Store answer in session
    const updatedSession = addAnswer(sessionId, answer)
    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to store answer' },
        { status: 500 }
      )
    }

    console.log(`✓ Answer stored for question ${questionId} in session ${sessionId} (risk: ${baseScore})`)

    return NextResponse.json(
      {
        success: true,
        baseRiskScore: baseScore,
        anomalies: signals,
        message: `Answer received. Risk score: ${baseScore}. Now answer the follow-up probe.`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Submit answer error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
