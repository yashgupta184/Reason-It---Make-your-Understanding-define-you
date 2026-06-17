import { NextRequest, NextResponse } from 'next/server'
import { getSession, getAnswer, updateAnswerFollowUp } from '@/lib/session'
import { analyzeFollowUp, GeminiError } from '@/lib/gemini'

/**
 * POST /api/generate-followup
 * 
 * Comprehension verification flow:
 * 1. Student has just answered a question
 * 2. System uses Gemini to analyze their answer for comprehension signals
 * 3. System returns follow-up probe + consistency analysis
 * 
 * Request body:
 * {
 *   "sessionId": "uuid",
 *   "questionId": "uuid",
 *   "followUpAnswerText": "Yes, because action and reaction are equal..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "consistencyScore": 85,
 *   "verdict": "likely_genuine",
 *   "reasoning": "Answer shows consistent understanding across original and follow-up.",
 *   "message": "Follow-up analysed. Moving to next question..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, questionId, followUpAnswerText } = body

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

    if (!followUpAnswerText || typeof followUpAnswerText !== 'string' || followUpAnswerText.trim().length === 0) {
      return NextResponse.json(
        { error: 'followUpAnswerText is required and must be non-empty' },
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

    // Get the question
    const question = session.questions.find(q => q.id === questionId)
    if (!question) {
      return NextResponse.json(
        { error: `Question not found: ${questionId}` },
        { status: 404 }
      )
    }

    // Get the original answer
    const originalAnswer = getAnswer(sessionId, questionId)
    if (!originalAnswer) {
      return NextResponse.json(
        { error: `Answer not found for question ${questionId}` },
        { status: 404 }
      )
    }

    console.log(`🔍 Analyzing follow-up for question ${questionId} in session ${sessionId}...`)

    // Call Gemini to analyze consistency
    const analysis = await analyzeFollowUp(
      originalAnswer.answerText,
      question.followUpQuestion,
      followUpAnswerText,
      question.followUpExpectedKeyPoints
    )

    // Store the follow-up answer
    updateAnswerFollowUp(sessionId, questionId, followUpAnswerText)

    console.log(`✓ Follow-up analysed (consistency: ${analysis.consistencyScore}, verdict: ${analysis.verdict})`)

    return NextResponse.json(
      {
        success: true,
        consistencyScore: analysis.consistencyScore,
        keyPointsCovered: analysis.keyPointsCovered,
        complexityMismatch: analysis.complexityMismatch,
        verdict: analysis.verdict,
        reasoning: analysis.reasoning,
        message: `Follow-up analysed. Consistency: ${analysis.consistencyScore}/100. ${analysis.verdict}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Follow-up analysis error:', error)

    if (error instanceof GeminiError) {
      return NextResponse.json(
        {
          error: 'Gemini API error',
          details: error.message,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
