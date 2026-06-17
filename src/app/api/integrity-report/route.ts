import { NextRequest, NextResponse } from 'next/server'
import { getSession, completeSession } from '@/lib/session'
import { computeAnswerRiskScore, getSeverityLabel } from '@/lib/scoring'
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

    // Compute overall risk score by averaging combined question risk scores (telemetry + follow-up)
    let totalCombinedScore = 0
    const scoredAnswers = session.answers.map(answer => {
      const { baseScore } = computeAnswerRiskScore(
        answer.answerText,
        answer.timeToAnswer,
        answer.keystrokes
      )

      let penalty = 0
      if (
        answer.verdict === 'likely_assisted' ||
        (answer.consistencyScore !== undefined && answer.consistencyScore < 60)
      ) {
        penalty = 35
      }

      const combinedScore = Math.min(baseScore + penalty, 100)
      totalCombinedScore += combinedScore

      return {
        ...answer,
        baseScore, // original telemetry score
        combinedScore,
      }
    })

    const overallScore = session.answers.length > 0
      ? Math.round(totalCombinedScore / session.answers.length)
      : 0

    // Generate integrity flags per question
    const flags: IntegrityFlag[] = scoredAnswers.map(answer => {
      const telemetryScore = answer.baseScore
      let flagType: 'paste_detected' | 'timing_anomaly' | 'followup_inconsistency' | 'clean' = 'clean'
      let detail = 'Normal typing patterns and consistent comprehension. Answer appears genuine.'
      let severity: 'low' | 'medium' | 'high' = 'low'

      // Check for follow-up inconsistency first (comprehension check takes priority)
      if (
        answer.verdict === 'likely_assisted' ||
        (answer.consistencyScore !== undefined && answer.consistencyScore < 40)
      ) {
        flagType = 'followup_inconsistency'
        detail = `Critical follow-up inconsistency detected. Student explanation contradicts original response (consistency: ${answer.consistencyScore || 0}/100, verdict: likely_assisted).`
        severity = 'high'
      } else if (answer.consistencyScore !== undefined && answer.consistencyScore < 60) {
        flagType = 'followup_inconsistency'
        detail = `Moderate follow-up inconsistency detected (consistency: ${answer.consistencyScore}/100). Explanation shows weak concept alignment.`
        severity = 'medium'
      } else if (telemetryScore >= 50) {
        flagType = 'timing_anomaly'
        detail = `Typing speed anomaly detected (${telemetryScore} risk points). Answer typed significantly faster than human capability.`
        severity = getSeverityLabel(telemetryScore) as 'low' | 'medium' | 'high'
      } else if (telemetryScore >= 30) {
        flagType = 'paste_detected'
        detail = `Potential paste event detected (${telemetryScore} risk points). Answer contains copied content.`
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
