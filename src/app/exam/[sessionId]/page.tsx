'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExamSession, KeystrokeEvent, Question } from '@/types'

interface AnswerData {
  questionId: string
  answerText: string
  riskScore: number
  anomalies: string[]
}

interface FollowUpState {
  followUpQuestion: string
  followUpAnswerText: string
  isLoading: boolean
  verdict?: string
  keyPoints?: number
  reasoning?: string
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  // Session and Question Management
  const [session, setSession] = useState<ExamSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Answer State
  const [answerText, setAnswerText] = useState('')
  const [keystrokes, setKeystrokes] = useState<KeystrokeEvent[]>([])
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  // Follow-up State
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpState, setFollowUpState] = useState<FollowUpState>({
    followUpQuestion: '',
    followUpAnswerText: '',
    isLoading: false,
  })
  const [currentAnswer, setCurrentAnswer] = useState<AnswerData | null>(null)

  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0)
  const [examCompleted, setExamCompleted] = useState(false)
  const [completionTime, setCompletionTime] = useState<number | null>(null)

  // Refs
  const lastKeystrokeTimeRef = useRef<number>(0)
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/session/${sessionId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch session')
        }

        const data = await response.json()
        setSession(data.session)
        setAnswerStartTime(Date.now())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  // Start timer
  useEffect(() => {
    if (session && !examCompleted) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      }
    }
  }, [session, examCompleted])

  // Keystroke tracking
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!answerStartTime) return

    const now = Date.now()
    const gap = lastKeystrokeTimeRef.current ? now - lastKeystrokeTimeRef.current : 0

    let keystrokeType: 'keydown' | 'paste' = 'keydown'
    if (e.ctrlKey && e.key === 'v') {
      keystrokeType = 'paste'
    }

    const keystroke: KeystrokeEvent = {
      timestamp: now,
      type: keystrokeType,
      gap,
    }

    setKeystrokes((prev) => [...prev, keystroke])
    lastKeystrokeTimeRef.current = now
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const now = Date.now()
    const gap = lastKeystrokeTimeRef.current ? now - lastKeystrokeTimeRef.current : 0

    const keystroke: KeystrokeEvent = {
      timestamp: now,
      type: 'paste',
      gap,
    }

    setKeystrokes((prev) => [...prev, keystroke])
    lastKeystrokeTimeRef.current = now
  }

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!session || !currentAnswer) return

    setSubmittingAnswer(true)
    setShowFollowUp(false)

    try {
      const timeToAnswer = Date.now() - (answerStartTime || Date.now())

      const response = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: session.questions[currentQuestionIndex].id,
          answerText: currentAnswer.answerText,
          timeToAnswer,
          keystrokes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to submit answer')
      }

      // Show follow-up probe
      const followUpQuestion = session.questions[currentQuestionIndex].followUpQuestion
      setFollowUpState({
        followUpQuestion,
        followUpAnswerText: '',
        isLoading: false,
      })
      setShowFollowUp(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer')
    } finally {
      setSubmittingAnswer(false)
    }
  }

  // Submit follow-up
  const handleSubmitFollowUp = async () => {
    if (!session || !currentAnswer) return

    setFollowUpState((prev) => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: session.questions[currentQuestionIndex].id,
          originalAnswer: currentAnswer.answerText,
          followUpAnswer: followUpState.followUpAnswerText,
          followUpQuestion: followUpState.followUpQuestion,
          expectedKeyPoints: session.questions[currentQuestionIndex].followUpExpectedKeyPoints,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to submit follow-up')
      }

      const data = await response.json()
      setFollowUpState((prev) => ({
        ...prev,
        isLoading: false,
        verdict: data.verdict,
        keyPoints: data.keyPointsCovered,
        reasoning: data.reasoning,
      }))

      // Move to next question or complete
      setTimeout(() => {
        moveToNextQuestion()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit follow-up')
      setFollowUpState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const moveToNextQuestion = () => {
    if (!session) return

    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setAnswerText('')
      setKeystrokes([])
      setShowFollowUp(false)
      setCurrentAnswer(null)
      setAnswerStartTime(Date.now())
      lastKeystrokeTimeRef.current = 0
      setFollowUpState({
        followUpQuestion: '',
        followUpAnswerText: '',
        isLoading: false,
      })
    } else {
      // Exam completed
      setExamCompleted(true)
      setCompletionTime(elapsedTime)
      setTimeout(() => {
        router.push(`/report/${sessionId}`)
      }, 3000)
    }
  }

  const handleContinueToReport = () => {
    router.push(`/report/${sessionId}`)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-slate-300">Loading your exam session...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-300 mb-2">Error</h2>
          <p className="text-slate-300">{error}</p>
          <button
            onClick={() => router.push('/educator')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Back to Educator Dashboard
          </button>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300">Session not found</p>
        </div>
      </main>
    )
  }

  if (examCompleted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-green-400 mb-2">Exam Complete!</h1>
          <p className="text-slate-300 mb-4">
            Great job! Your exam took <strong>{completionTime}s</strong> to complete.
          </p>
          <p className="text-slate-400 mb-6 text-sm">
            Redirecting to integrity report in a moment...
          </p>
          <button
            onClick={handleContinueToReport}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            View Report Now
          </button>
        </div>
      </main>
    )
  }

  const currentQuestion = session.questions[currentQuestionIndex]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Student Exam</h1>
            <p className="text-slate-300 text-sm">Session: {sessionId.slice(0, 8)}...</p>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <p className="text-xs text-slate-400 mb-1">Time Elapsed</p>
              <p className="text-2xl font-bold text-blue-400">{String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}</p>
            </div>

            {/* Question Counter */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <p className="text-xs text-slate-400 mb-1">Question</p>
              <p className="text-2xl font-bold text-blue-400">
                {currentQuestionIndex + 1} / {session.questions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* Question Display */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Concept</p>
            <p className="text-blue-400 font-medium">{currentQuestion.originalConcept}</p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">{currentQuestion.questionText}</h2>

          {/* Answer Textarea */}
          {!showFollowUp && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Answer</label>
              <textarea
                ref={answerTextareaRef}
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value)
                  if (!currentAnswer) {
                    setCurrentAnswer({
                      questionId: currentQuestion.id,
                      answerText: e.target.value,
                      riskScore: 0,
                      anomalies: [],
                    })
                  } else {
                    setCurrentAnswer({
                      ...currentAnswer,
                      answerText: e.target.value,
                    })
                  }
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type or paste your answer here..."
                className="w-full h-40 px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-slate-400 mt-2">
                Character count: {answerText.length} | Keystrokes detected: {keystrokes.length}
              </p>
            </div>
          )}

          {/* Follow-up Section */}
          {showFollowUp && (
            <div className="mb-6 space-y-4">
              {/* Original Answer Display */}
              <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Original Answer</p>
                <p className="text-slate-200">{currentAnswer?.answerText}</p>
              </div>

              {/* Follow-up Question */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                  One quick follow-up on your answer:
                </label>
                <p className="text-slate-200 mb-4 text-lg italic">"{followUpState.followUpQuestion}"</p>

                {!followUpState.verdict && (
                  <textarea
                    value={followUpState.followUpAnswerText}
                    onChange={(e) =>
                      setFollowUpState((prev) => ({
                        ...prev,
                        followUpAnswerText: e.target.value,
                      }))
                    }
                    placeholder="Type your follow-up answer here..."
                    className="w-full h-24 px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  />
                )}
              </div>

              {/* Verdict Display */}
              {followUpState.verdict && (
                <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Analysis Result</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-300 text-sm">
                        <strong>Verdict:</strong> {followUpState.verdict.replace(/_/g, ' ')}
                      </p>
                    </div>
                    {followUpState.keyPoints !== undefined && (
                      <p className="text-slate-300 text-sm">
                        <strong>Key Points Covered:</strong> {followUpState.keyPoints}%
                      </p>
                    )}
                    {followUpState.reasoning && (
                      <p className="text-slate-300 text-sm">
                        <strong>Analysis:</strong> {followUpState.reasoning.slice(0, 200)}...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && !showFollowUp && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            {!showFollowUp && (
              <button
                onClick={handleSubmitAnswer}
                disabled={submittingAnswer || !answerText.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded font-semibold transition"
              >
                {submittingAnswer ? 'Analysing...' : 'Submit Answer'}
              </button>
            )}

            {showFollowUp && !followUpState.verdict && (
              <button
                onClick={handleSubmitFollowUp}
                disabled={followUpState.isLoading || !followUpState.followUpAnswerText.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded font-semibold transition"
              >
                {followUpState.isLoading ? 'Analysing...' : 'Submit Follow-up'}
              </button>
            )}

            {showFollowUp && followUpState.verdict && (
              <button
                onClick={moveToNextQuestion}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
              >
                {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'View Report'}
              </button>
            )}
          </div>
        </div>

        {/* Key Points Reference */}
        {!showFollowUp && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Expected Key Points</p>
            <ul className="space-y-2">
              {currentQuestion.expectedKeyPoints.map((point, idx) => (
                <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
