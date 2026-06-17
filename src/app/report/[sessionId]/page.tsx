'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ExamSession, IntegrityReport, Question, Answer, IntegrityFlag } from '@/types'

// Format milliseconds into human-readable duration (e.g. 2m 14s or 45s)
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

// Retrieve severity classes for scoring gauge
function getSeverityColors(score: number): {
  stroke: string
  text: string
  bg: string
  border: string
  label: string
} {
  if (score >= 70) {
    return {
      stroke: 'stroke-rose-500',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      label: 'High Risk',
    }
  }
  if (score >= 40) {
    return {
      stroke: 'stroke-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Medium Risk',
    }
  }
  return {
    stroke: 'stroke-emerald-500',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Low Risk',
  }
}

// Retrieve flag badge styling
function getFlagBadgeClasses(type: string, severity: string): string {
  if (type === 'clean') {
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
  }
  if (severity === 'high') {
    return 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse'
  }
  if (severity === 'medium') {
    return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
  }
  return 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
}

// Retrieve verdict badge styling
function getVerdictBadgeClasses(verdict?: string): string {
  if (verdict === 'likely_genuine') {
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
  }
  if (verdict === 'likely_assisted') {
    return 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
  }
  return 'bg-slate-700 text-slate-300 border border-slate-600'
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<ExamSession | null>(null)
  const [report, setReport] = useState<IntegrityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({})

  // Fetch session details and report concurrently
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch ephemeral session data
        const sessionRes = await fetch(`/api/session/${sessionId}`)
        if (!sessionRes.ok) {
          const errorData = await sessionRes.json()
          throw new Error(errorData.error || 'Failed to fetch session details')
        }
        const sessionData = await sessionRes.json()
        setSession(sessionData.session)

        // 2. Fetch computed integrity report data
        const reportRes = await fetch('/api/integrity-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        if (!reportRes.ok) {
          const errorData = await reportRes.json()
          throw new Error(errorData.details || 'Failed to generate integrity report')
        }
        const reportData = await reportRes.json()
        setReport(reportData.report)

        // Expand the first question card by default
        if (sessionData.session?.questions?.length > 0) {
          setExpandedQuestions({ [sessionData.session.questions[0].id]: true })
        }
      } catch (err) {
        console.error('Fetch report data error:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while loading reports')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchReportData()
    }
  }, [sessionId])

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  const handleScrollToQuestion = (questionId: string) => {
    // Ensure card is expanded
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: true,
    }))
    
    // Smooth scroll to element
    setTimeout(() => {
      const el = document.getElementById(`question-card-${questionId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-400 animate-pulse font-medium">Generating Integrity Assessment...</p>
        </div>
      </main>
    )
  }

  if (error || !session || !report) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 max-w-md text-center shadow-xl">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400 font-bold text-xl">!</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Report</h2>
          <p className="text-slate-400 mb-6 text-sm">
            {error || 'The requested exam session could not be retrieved or is incomplete.'}
          </p>
          <button
            onClick={() => router.push('/educator')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition"
          >
            Back to Educator Dashboard
          </button>
        </div>
      </main>
    )
  }

  const colors = getSeverityColors(report.overallRiskScore)
  const totalQuestions = session.questions.length
  const flaggedCount = report.flags.filter((f) => f.flagType !== 'clean').length

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              <span>Exam Integrity Audit</span>
              <span>•</span>
              <span className="text-blue-400">Session ID: {sessionId.slice(0, 18)}...</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Integrity Assessment Report</h1>
          </div>
          <button
            onClick={() => router.push('/educator')}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white rounded-lg text-sm font-semibold shadow-md transition"
          >
            ← Educator Dashboard
          </button>
        </div>

        {/* Hero Row: Score Widget & AI Narrative Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Circular Score Widget */}
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 self-start">Overall Session Risk</h3>
            
            <div className="relative flex items-center justify-center mb-4">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Score Arc */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className={`${colors.stroke} transition-all duration-1000`}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - report.overallRiskScore / 100)}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{report.overallRiskScore}%</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${colors.text} mt-0.5`}>
                  {colors.label}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 font-medium">
              Based on {totalQuestions} answered question{totalQuestions !== 1 ? 's' : ''}
            </p>
          </div>

          {/* AI Narrative Summary Card */}
          <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-xl p-6 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-400">AI Integrity Narrative</h3>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  Gemini Scored
                </span>
              </div>
              <p className="text-slate-200 text-base leading-relaxed italic bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                "{report.summary}"
              </p>
            </div>
            
            {/* Metadata Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800/60 text-xs">
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">Student Alias</p>
                <p className="text-slate-300 font-bold">{session.studentAlias || 'Anonymous Student'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">Total Anomalies</p>
                <p className={`font-bold ${flaggedCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {flaggedCount} raised
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">Start Time</p>
                <p className="text-slate-300 font-bold">
                  {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">Duration</p>
                <p className="text-slate-300 font-bold">
                  {session.completedAt ? formatTime(session.completedAt - session.startedAt) : 'In Progress'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Sequence Overview */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-xl p-5 shadow-lg">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Telemetry Timeline Overview</h3>
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {session.questions.map((q, idx) => {
              const ans = session.answers.find((a) => a.questionId === q.id)
              const flag = report.flags.find((f) => f.questionId === q.id)
              const hasFlag = flag && flag.flagType !== 'clean'
              const flagSeverity = flag?.severity || 'low'
              
              // Colors for timeline dots
              let dotBg = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              if (hasFlag) {
                dotBg = flagSeverity === 'high'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleScrollToQuestion(q.id)}
                  className={`flex-1 p-3 rounded-lg flex items-center justify-between text-left hover:scale-[1.02] active:scale-95 transition-all cursor-pointer ${dotBg}`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">Question {idx + 1}</p>
                    <p className="text-sm font-extrabold truncate mt-0.5">{q.originalConcept}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="text-xs font-semibold">{ans ? formatTime(ans.timeToAnswer) : '--'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-75 mt-0.5">
                      {flag ? flag.flagType.replace(/_/g, ' ') : 'unanswered'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Question Integrity Details</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700">
              {totalQuestions} Item{totalQuestions !== 1 ? 's' : ''}
            </span>
          </h2>

          <div className="space-y-4">
            {session.questions.map((question, idx) => {
              const answer = session.answers.find((a) => a.questionId === question.id)
              const flag = report.flags.find((f) => f.questionId === question.id)
              const isExpanded = !!expandedQuestions[question.id]
              
              const pasteCount = answer?.keystrokes.filter((k) => k.type === 'paste').length || 0
              const maxGap = answer?.keystrokes && answer.keystrokes.length > 0
                ? Math.max(...answer.keystrokes.map((k) => k.gap))
                : 0

              // Calculate character speed
              const speedCharsSec = answer && answer.timeToAnswer > 0
                ? Math.round((answer.answerText.length / (answer.timeToAnswer / 1000)) * 10) / 10
                : 0

              return (
                <div
                  key={question.id}
                  id={`question-card-${question.id}`}
                  className={`bg-slate-900/60 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
                    isExpanded ? 'border-slate-700 ring-1 ring-slate-800' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header (Click to Toggle) */}
                  <div
                    onClick={() => toggleQuestion(question.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 select-none transition"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-sm font-black text-blue-400 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/60 mr-2 uppercase">
                          {question.difficulty}
                        </span>
                        <span className="text-slate-300 font-extrabold text-sm sm:text-base">
                          {question.originalConcept}
                        </span>
                        <p className="text-xs text-slate-500 truncate mt-1 max-w-lg italic">
                          "{question.questionText}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      {flag && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${getFlagBadgeClasses(flag.flagType, flag.severity)}`}>
                          {flag.flagType.replace(/_/g, ' ')}
                        </span>
                      )}
                      <svg
                        className={`w-5 h-5 text-slate-500 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Body Content */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 space-y-6">
                      
                      {/* Subtitle / Mutated Question Prompt */}
                      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">MUTATED EXAM QUESTION GIVEN TO STUDENT</p>
                        <p className="text-white font-medium text-base leading-relaxed">"{question.questionText}"</p>
                      </div>

                      {/* side by side comparison grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* LEFT COLUMN: TELEMETRY & ORIGINAL ANSWER */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Original Submission & Telemetry
                          </h4>

                          {/* Original Answer Content Box */}
                          <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg min-h-[120px] max-h-[220px] overflow-y-auto">
                            {answer ? (
                              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{answer.answerText}</p>
                            ) : (
                              <p className="text-slate-600 text-sm italic">No answer submitted for this question.</p>
                            )}
                          </div>

                          {/* Telemetry Metrics cards */}
                          {answer && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                              {/* Duration */}
                              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Duration</p>
                                <p className="text-base font-extrabold text-white mt-1">{formatTime(answer.timeToAnswer)}</p>
                              </div>
                              {/* Character count */}
                              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Length</p>
                                <p className="text-base font-extrabold text-white mt-1">{answer.answerText.length} chars</p>
                              </div>
                              {/* Typing speed */}
                              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Speed</p>
                                <p className={`text-base font-extrabold mt-1 ${speedCharsSec > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {speedCharsSec} CPS
                                </p>
                              </div>
                              {/* Paste Events */}
                              <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 text-center">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Clipboard</p>
                                <p className={`text-base font-extrabold mt-1 ${pasteCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                                  {pasteCount > 0 ? `${pasteCount} paste` : '0 paste'}
                                </p>
                              </div>
                            </div>
                          )}

                          {answer && maxGap > 0 && (
                            <div className="text-[10px] text-slate-500 bg-slate-900/30 px-3 py-1.5 rounded border border-slate-900/60 flex items-center justify-between">
                              <span>Max Keystroke Gap Pause Spike:</span>
                              <span className={`font-semibold ${maxGap > 5000 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                                {(maxGap / 1000).toFixed(1)}s
                              </span>
                            </div>
                          )}
                        </div>

                        {/* RIGHT COLUMN: FOLLOW-UP PROBE & AI COMPREHENSION ANALYSIS */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            AI Verification & Probe
                          </h4>

                          {/* Follow-up Question Prompt */}
                          <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-sm">
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">UNEXPECTED AI PROBE</p>
                            <p className="text-slate-200 italic font-semibold">"{question.followUpQuestion}"</p>
                          </div>

                          {/* Follow-up Answer Content Box */}
                          <div className="p-4 bg-slate-950 border border-slate-900 rounded-lg min-h-[90px] max-h-[160px] overflow-y-auto">
                            {answer && answer.followUpAnswerText ? (
                              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{answer.followUpAnswerText}</p>
                            ) : (
                              <p className="text-slate-600 text-sm italic">Comprehension follow-up response was not provided.</p>
                            )}
                          </div>

                          {/* AI Verification Metric Bars */}
                          {answer && answer.consistencyScore !== undefined ? (
                            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-4 space-y-4">
                              
                              {/* Verdict Badge */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-400">AI Reasoning Verdict:</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${getVerdictBadgeClasses(answer.verdict)}`}>
                                  {answer.verdict?.replace(/_/g, ' ')}
                                </span>
                              </div>

                              {/* Consistency Score Bar */}
                              <div>
                                <div className="flex items-center justify-between text-xs font-bold mb-1">
                                  <span className="text-slate-400">Conceptual Consistency Score:</span>
                                  <span className={answer.consistencyScore < 60 ? 'text-rose-400' : 'text-emerald-400'}>
                                    {answer.consistencyScore}/100
                                  </span>
                                </div>
                                <div className="bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${answer.consistencyScore < 60 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${answer.consistencyScore}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Concept Key Points Covered */}
                              {answer.keyPointsCovered !== undefined && (
                                <div>
                                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-400">Key Rubric Points Covered:</span>
                                    <span className="text-slate-300">{answer.keyPointsCovered}%</span>
                                  </div>
                                  <div className="bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                      style={{ width: `${answer.keyPointsCovered}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* AI Reasoning Text */}
                              {answer.reasoning && (
                                <div className="text-[11px] text-slate-400 bg-slate-950/30 p-2.5 rounded border border-slate-950 text-left">
                                  <p className="font-semibold text-slate-500 uppercase text-[9px] mb-1.5">Gemini Verdict Analysis</p>
                                  <p className="leading-relaxed">"{answer.reasoning}"</p>
                                </div>
                              )}

                            </div>
                          ) : (
                            <div className="text-center p-4 bg-slate-900/20 border border-slate-800/40 rounded-lg">
                              <p className="text-xs text-slate-500 italic">No AI consistency analysis data available for this question.</p>
                            </div>
                          )}

                        </div>
                      </div>

                      {/* Flags details and comments */}
                      {flag && flag.flagType !== 'clean' && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 border ${
                          flag.severity === 'high' ? 'bg-rose-500/5 border-rose-500/20 text-rose-300' : 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                        }`}>
                          <span className="text-lg leading-none mt-0.5">⚠️</span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider">Telemetry Risk Assessment</p>
                            <p className="text-sm mt-1 text-slate-300 font-medium">{flag.detail}</p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </main>
  )
}
