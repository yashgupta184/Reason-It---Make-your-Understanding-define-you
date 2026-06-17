import { NextRequest, NextResponse } from 'next/server'
import { generateQuestions, GeminiError } from '@/lib/gemini'
import { createSession } from '@/lib/session'

/**
 * POST /api/generate-questions
 * 
 * Educator flow:
 * 1. Educator enters a topic
 * 2. System calls this endpoint to generate unique question variants
 * 3. Returns questions + creates a new exam session per student
 * 
 * Request body:
 * {
 *   "topic": "Newton's Third Law",
 *   "numQuestions": 3,
 *   "numStudents": 2
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "sessionIds": ["session-1", "session-2"],
 *   "questions": [ Question[], ... ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, numQuestions = 3, numStudents = 2 } = body

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 10) {
      return NextResponse.json(
        { error: 'numQuestions must be an integer between 1 and 10' },
        { status: 400 }
      )
    }

    if (!Number.isInteger(numStudents) || numStudents < 1 || numStudents > 10) {
      return NextResponse.json(
        { error: 'numStudents must be an integer between 1 and 10' },
        { status: 400 }
      )
    }

    console.log(`📝 Generating ${numQuestions} questions on "${topic}" for ${numStudents} students...`)

    // Call Gemini to generate questions
    const questions = await generateQuestions(topic, numQuestions)

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions were generated' },
        { status: 500 }
      )
    }

    // Create a session for each student with the generated questions
    const sessionIds: string[] = []
    for (let i = 0; i < numStudents; i++) {
      const session = createSession(`Student ${String.fromCharCode(65 + i)}`, questions)
      sessionIds.push(session.sessionId)
    }

    console.log(`✓ Generated ${questions.length} questions and created ${sessionIds.length} sessions`)

    return NextResponse.json(
      {
        success: true,
        sessionIds,
        questions,
        message: `Generated ${numQuestions} question(s) for ${numStudents} student(s)`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Question generation error:', error)

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
