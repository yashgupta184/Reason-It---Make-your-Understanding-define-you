import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

/**
 * GET /api/session/:sessionId
 * 
 * Retrieves exam session data by sessionId.
 * Called by student exam page to load the session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const session = getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        session,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Session fetch error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
