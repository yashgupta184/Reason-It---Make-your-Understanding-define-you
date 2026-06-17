/**
 * Gemini AI Client
 * 
 * Initializes and manages the Google Gemini API connection.
 * 
 * Three use cases:
 * 1. Question mutation — generate N unique question variants from a topic
 * 2. Follow-up analysis — assess consistency between original and follow-up answers
 * 3. Report narrative — generate a professional summary of integrity findings
 * 
 * The API key must be provided via GEMINI_API_KEY environment variable.
 * Never expose or log the key.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { Question } from '@/types'

// Initialize Gemini client from environment
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY environment variable not set. Gemini API calls will fail.')
}

const client = apiKey ? new GoogleGenerativeAI(apiKey) : null
const model = client?.getGenerativeModel({ model: 'gemini-pro' })

/**
 * Error class for Gemini API errors
 */
export class GeminiError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'GeminiError'
  }
}

/**
 * PROMPT 1: Question Mutation Engine
 * 
 * Generates N unique question variants from a single topic.
 * Each variant tests the same concept but with different scenarios and phrasing.
 */
const QUESTION_GENERATION_PROMPT = (topic: string, numVariants: number): string => `
You are an expert examination designer with deep knowledge of Bloom's Taxonomy.

Your task: Generate ${numVariants} structurally UNIQUE but conceptually EQUIVALENT 
questions on the topic: "${topic}"

Rules:
1. Every question must test the SAME core concept but use different scenarios, numbers, 
   phrasings, or real-world contexts. A student who copies another student's answer 
   verbatim must score zero.
2. Each question must require genuine understanding — not recall of a definition.
3. Include one follow-up micro-question per question. The follow-up must test whether 
   the student actually understands their own answer — not whether they can reproduce 
   information.
4. Tag each question with difficulty: foundational | applied | analytical

Return ONLY a valid JSON array. No markdown. No explanation. No preamble.
Schema:
[{ 
  "id": "uuid-1",
  "originalConcept": "string",
  "questionText": "string", 
  "expectedKeyPoints": ["string"],
  "difficulty": "applied",
  "subject": "${topic}",
  "followUpQuestion": "string",
  "followUpExpectedKeyPoints": ["string"]
}]
`

/**
 * PROMPT 2: Comprehension Verification
 * 
 * Analyzes whether a student genuinely understands a concept or reproduced an AI answer.
 * Compares consistency between original answer and follow-up response.
 */
const FOLLOWUP_ANALYSIS_PROMPT = (
  originalAnswer: string,
  followUpQuestion: string,
  followUpAnswer: string,
  expectedKeyPoints: string[]
): string => `
You are assessing whether a student genuinely understands a concept or reproduced 
an AI-generated answer.

Original answer: "${originalAnswer}"
Follow-up question: "${followUpQuestion}"
Student's follow-up response: "${followUpAnswer}"
Expected key points: ${JSON.stringify(expectedKeyPoints)}

Analyse:
1. Does the follow-up answer show conceptual continuity with the original?
   (Genuine students are consistent. AI-generated answers often contradict 
   themselves when probed from a different angle.)
2. Does the follow-up hit expected key points in the student's own words?
3. Is there a vocabulary or complexity mismatch between original and follow-up?
   (Suggests original was AI-generated, follow-up was the student's real voice.)

Return ONLY valid JSON. No markdown.
{
  "consistencyScore": 0-100,
  "keyPointsCovered": 0-100,
  "complexityMismatch": true | false,
  "verdict": "likely_genuine" | "likely_assisted" | "inconclusive",
  "reasoning": "one sentence explanation"
}
`

/**
 * PROMPT 3: Integrity Report Narrative
 * 
 * Generates a professional, non-accusatory summary of integrity findings.
 */
const REPORT_SUMMARY_PROMPT = (
  flags: Array<{
    questionId: string
    flagType: string
    detail: string
    severity: string
  }>
): string => `
You are writing an integrity summary for an educator reviewing exam results.
Be precise, non-accusatory, and evidence-based.

Flags detected: ${JSON.stringify(flags, null, 2)}

Write a 2-3 sentence professional summary that:
1. States what was observed behaviourally (timing anomalies, paste events, 
   follow-up inconsistencies)
2. States the overall risk level: low / moderate / high
3. Recommends a specific next action:
   - "No action required"
   - "Oral follow-up recommended"
   - "Manual review required"

Do not accuse the student. Describe the signals. Let the educator decide.
Return plain text only. No JSON. No formatting.
`

/**
 * Generate question variants using Gemini.
 * 
 * @param topic The exam topic/subject
 * @param numVariants Number of unique questions to generate
 * @returns Array of Question objects
 * @throws GeminiError if API call fails or response is invalid JSON
 */
export async function generateQuestions(
  topic: string,
  numVariants: number
): Promise<Question[]> {
  if (!model) {
    throw new GeminiError('Gemini API client not initialized. GEMINI_API_KEY is missing.')
  }

  try {
    const prompt = QUESTION_GENERATION_PROMPT(topic, numVariants)
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the JSON response
    let questions: Question[]
    try {
      questions = JSON.parse(text)
    } catch (parseError) {
      throw new GeminiError(
        `Failed to parse Gemini response as JSON. Response: ${text.substring(0, 200)}...`,
        parseError
      )
    }

    // Validate the response structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new GeminiError(`Expected array of questions, got: ${typeof questions}`)
    }

    // Ensure all required fields are present
    questions.forEach((q, idx) => {
      if (!q.id || !q.questionText || !q.followUpQuestion) {
        throw new GeminiError(
          `Question ${idx} missing required fields: id, questionText, or followUpQuestion`
        )
      }
    })

    return questions
  } catch (error) {
    if (error instanceof GeminiError) throw error
    throw new GeminiError(`Question generation failed: ${error instanceof Error ? error.message : String(error)}`, error)
  }
}

/**
 * Analyze follow-up answer for consistency with original answer.
 * 
 * @param originalAnswer The student's answer to the original question
 * @param followUpQuestion The follow-up probe question
 * @param followUpAnswer The student's answer to the follow-up
 * @param expectedKeyPoints Expected key points for the follow-up
 * @returns Analysis including consistency score and verdict
 * @throws GeminiError if API call fails or response is invalid JSON
 */
export async function analyzeFollowUp(
  originalAnswer: string,
  followUpQuestion: string,
  followUpAnswer: string,
  expectedKeyPoints: string[]
): Promise<{
  consistencyScore: number
  keyPointsCovered: number
  complexityMismatch: boolean
  verdict: 'likely_genuine' | 'likely_assisted' | 'inconclusive'
  reasoning: string
}> {
  if (!model) {
    throw new GeminiError('Gemini API client not initialized. GEMINI_API_KEY is missing.')
  }

  try {
    const prompt = FOLLOWUP_ANALYSIS_PROMPT(
      originalAnswer,
      followUpQuestion,
      followUpAnswer,
      expectedKeyPoints
    )
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse the JSON response
    let analysis: {
      consistencyScore: number
      keyPointsCovered: number
      complexityMismatch: boolean
      verdict: 'likely_genuine' | 'likely_assisted' | 'inconclusive'
      reasoning: string
    }
    try {
      analysis = JSON.parse(text)
    } catch (parseError) {
      throw new GeminiError(
        `Failed to parse follow-up analysis as JSON. Response: ${text.substring(0, 200)}...`,
        parseError
      )
    }

    // Validate scores are in range 0-100
    if (analysis.consistencyScore < 0 || analysis.consistencyScore > 100) {
      throw new GeminiError(
        `Invalid consistency score: ${analysis.consistencyScore}. Expected 0-100.`
      )
    }
    if (analysis.keyPointsCovered < 0 || analysis.keyPointsCovered > 100) {
      throw new GeminiError(
        `Invalid keyPointsCovered score: ${analysis.keyPointsCovered}. Expected 0-100.`
      )
    }

    return analysis
  } catch (error) {
    if (error instanceof GeminiError) throw error
    throw new GeminiError(
      `Follow-up analysis failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

/**
 * Generate a professional integrity report narrative.
 * 
 * @param flags Array of integrity flags from the session
 * @returns Professional summary text
 * @throws GeminiError if API call fails
 */
export async function generateReportNarrative(
  flags: Array<{
    questionId: string
    flagType: string
    detail: string
    severity: string
  }>
): Promise<string> {
  if (!model) {
    throw new GeminiError('Gemini API client not initialized. GEMINI_API_KEY is missing.')
  }

  try {
    const prompt = REPORT_SUMMARY_PROMPT(flags)
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // The response should be plain text, no parsing needed
    if (!text || text.trim().length === 0) {
      throw new GeminiError('Report narrative generation returned empty response')
    }

    return text.trim()
  } catch (error) {
    if (error instanceof GeminiError) throw error
    throw new GeminiError(
      `Report narrative generation failed: ${error instanceof Error ? error.message : String(error)}`,
      error
    )
  }
}

/**
 * Health check — verify Gemini API is accessible.
 * 
 * Returns true if API key is set and client is initialized.
 * This does NOT make an API call, just checks configuration.
 */
export function isGeminiConfigured(): boolean {
  return !!model && !!apiKey
}
