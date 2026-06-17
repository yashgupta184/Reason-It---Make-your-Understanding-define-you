'use client'

import { useState } from 'react'
import { Question } from '@/types'

interface GeneratedExam {
  sessionIds: string[]
  questions: Question[]
}

export default function EducatorPage() {
  const [topic, setTopic] = useState('')
  const [numStudents, setNumStudents] = useState(2)
  const [difficulty, setDifficulty] = useState<'foundational' | 'applied' | 'analytical'>('applied')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<GeneratedExam | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setExam(null)

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          numQuestions: 3,
          numStudents,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to generate questions')
      }

      const data = await response.json()
      setExam({
        sessionIds: data.sessionIds,
        questions: data.questions,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, sessionId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(sessionId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'http://localhost:3000'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Educator Dashboard</h1>
          <p className="text-slate-300">Generate unique exam questions and launch student sessions</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-6">Generate Exam</h2>
              
              <form onSubmit={handleGenerateExam} className="space-y-4">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Topic / Subject
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Newton's Third Law"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    AI will generate structurally unique variations of this topic
                  </p>
                </div>

                {/* Number of Students */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Students
                  </label>
                  <select
                    value={numStudents}
                    onChange={(e) => setNumStudents(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} student{n !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Each gets a unique question set
                  </p>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="foundational">Foundational</option>
                    <option value="applied">Applied</option>
                    <option value="analytical">Analytical</option>
                  </select>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-900 border border-red-700 rounded text-red-100 text-sm">
                    {error}
                  </div>
                )}

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={loading || !topic.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded transition"
                >
                  {loading ? 'Generating...' : 'Generate Exam'}
                </button>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!exam ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400">
                  {loading ? 'Generating unique question variants...' : 'Enter a topic and click "Generate Exam" to create student sessions'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Session Links */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Student Session Links</h3>
                  <div className="space-y-3">
                    {exam.sessionIds.map((sessionId, idx) => {
                      const examUrl = `${getBaseUrl()}/exam/${sessionId}`
                      return (
                        <div key={sessionId} className="flex items-center gap-2 bg-slate-700 p-3 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-300 font-medium">Student {String.fromCharCode(65 + idx)}</p>
                            <p className="text-xs text-slate-500 truncate">{examUrl}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(examUrl, sessionId)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded whitespace-nowrap"
                          >
                            {copiedId === sessionId ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    📝 Share these links with students. Each link provides a unique set of questions on the same topic.
                  </p>
                </div>

                {/* Question Variants Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Question Variants Preview</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    These {exam.questions.length} question(s) are structurally equivalent but textually unique. All students answer the same concepts, but no two papers are identical.
                  </p>
                  
                  <div className="space-y-4">
                    {exam.questions.map((question, idx) => (
                      <div
                        key={question.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition"
                      >
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold bg-blue-600 text-white px-2 py-1 rounded">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                              {question.difficulty}
                            </span>
                          </div>
                          <p className="text-white font-medium">{question.questionText}</p>
                        </div>

                        <div className="bg-slate-700 p-3 rounded mb-4">
                          <p className="text-xs text-slate-400 mb-2 font-semibold">Concept:</p>
                          <p className="text-sm text-slate-200">{question.originalConcept}</p>
                        </div>

                        <div className="bg-slate-700 p-3 rounded mb-4">
                          <p className="text-xs text-slate-400 mb-2 font-semibold">Follow-up Probe:</p>
                          <p className="text-sm text-slate-200">{question.followUpQuestion}</p>
                        </div>

                        <div className="bg-slate-700 p-3 rounded">
                          <p className="text-xs text-slate-400 mb-2 font-semibold">Expected Key Points:</p>
                          <ul className="text-sm text-slate-200 space-y-1">
                            {question.expectedKeyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setExam(null); setTopic('') }}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded transition"
                  >
                    Generate New Exam
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
