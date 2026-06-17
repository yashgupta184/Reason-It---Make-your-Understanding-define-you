import { NextRequest, NextResponse } from 'next/server'
import { getSession, completeSession } from '@/lib/session'
import { computeSessionRiskScore, getSeverityLabel } from '@/lib/scoring'
import { generateReportNarrative, GeminiError } from '@/lib/gemini'
import { IntegrityFlag, IntegrityReport } from '@/types'

/**
 * POST /api/integrity-report
 * 
 * Report generation flow:
 * 1. Student completes exam (all questions answered + follow-ups done)
 * 2. System computes final integrity report
 * 3. System generates professional narrative
 * 4. Returns report for educator dashboard
 * 
 * Request body:
 * {
 *   "sessionId": "uuid"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "report": {
 *     "sessionId": "uuid",
 *     "overallRiskScore": 35,
 *     "flags": [
 *       { "questionId": "uuid", "flagType": "clean", "detail": "...", "severity": "low" },
 *       { "questionId": "uuid", "flagType": "timing_anomaly", "detail": "...", "severity": "medium" }
 *     ],
 *     "summary": "Answer 1 shows normal typing patterns. Answer 2 has timing anomaly..."
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    // Validate input
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'sessionId is required' },
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

    console.log(`📊 Generating integrity report for session ${sessionId}...`)

    // Compute overall risk score
    const { overallScore, scoreBreakdown } = computeSessionRiskScore(session)

    // Generate integrity flags per question
    const flags: IntegrityFlag[] = session.answers.map(answer => {
      // Find the breakdown for this question
      const breakdown = scoreBreakdown.find(b => b.questionId === answer.questionId)
      const baseScore = breakdown?.baseScore || 0

      // Determine flag type based on signals
      let flagType: 'paste_detected' | 'timing_anomaly' | 'followup_inconsistency' | 'clean' = 'clean'
      let detail = 'Normal typing patterns. Answer appears genuine.'
      let severity: 'low' | 'medium' | 'high' = 'low'

      // Check for specific signals (simplified — full version would track per-signal)
      if (baseScore >= 50) {
        flagType = 'timing_anomaly'
        detail = `Typing speed anomaly detected (${baseScore} risk points). Answer typed significantly faster than human capability.`
        severity = getSeverityLabel(baseScore) as 'low' | 'medium' | 'high'
      } else if (baseScore >= 20) {
        flagType = 'paste_detected'
        detail = `Potential paste event detected (${baseScore} risk points). Answer may contain copied content.`
        severity = 'medium'
      }

      return {
        questionId: answer.questionId,
        flagType,
        detail,
        severity,
      }
    })

    console.log(`✓ Generated ${flags.length} integrity flags`)

    // Generate narrative summary using Gemini
    let summary = `Integrity Report: Overall risk score ${overallScore}/100.`
    try {
      summary = await generateReportNarrative(flags)
      console.log(`✓ Generated professional narrative summary`)
    } catch (narrativeError) {
      console.warn('⚠️  Could not generate narrative, using default:', narrativeError)
      // Fall back to a basic summary if Gemini fails
      const highFlags = flags.filter(f => f.severity === 'high')
      if (highFlags.length > 0) {
        summary = `High-risk flags detected in ${highFlags.length} answer(s). Manual review recommended.`
      } else {
        summary = `Exam completed with overall risk score ${overallScore}/100. ${overallScore < 40 ? 'Low risk.' : 'Moderate risk detected.'}`
      }
    }

    // Mark session as completed
    completeSession(sessionId)

    // Create final report
    const report: IntegrityReport = {
      sessionId,
      overallRiskScore: overallScore,
      flags,
      summary,
      generatedAt: Date.now(),
    }

    console.log(`✓ Integrity report completed for session ${sessionId}`)

    return NextResponse.json(
      {
        success: true,
        report,
        message: `Integrity report generated. Overall risk: ${overallScore}/100.`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Report generation error:', error)

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
