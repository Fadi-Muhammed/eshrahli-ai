const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(systemPrompt, userContent, jsonMode = false) {
  const res = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      ...(jsonMode && {
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini API error ${res.status}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ─── Explanation ──────────────────────────────────────────────────────────────
// System prompt matches BRIDGE_AI_SPECIFICATION.md exactly
const EXPLANATION_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English, specializing in explaining university-level course material to students whose primary language is Arabic. You will be given the text content from a university lecture slide. Explain the concepts in clear, natural Arabic. Every key English academic or technical term must remain in English and be wrapped in bold formatting. Do not translate technical terms into Arabic — instead, explain them in Arabic around the bolded English word. Write in flowing paragraph form, not bullet points. Keep the explanation between 4 and 6 sentences. End with one Arabic sentence summarizing the main takeaway of the slide. Do not add any information not present in the slide.`

export async function generateExplanation(slideText) {
  return callGemini(EXPLANATION_SYSTEM_PROMPT, slideText)
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────
const QA_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English. You answer student follow-up questions about university lecture slides. Always respond in clear, natural Arabic. Every key English academic or technical term must remain in English and be wrapped in bold formatting (**term**). Do not translate technical terms into Arabic. Be concise but thorough.`

export async function answerQuestion(slideText, question, history = []) {
  const historyStr = history
    .map((q) => `Student: ${q.question_text}\nTutor: ${q.answer_text}`)
    .join('\n\n')

  const userContent = `Slide content:\n${slideText}\n\n${historyStr ? `Previous Q&A:\n${historyStr}\n\n` : ''}Student question: ${question}`

  return callGemini(QA_SYSTEM_PROMPT, userContent)
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
const QUIZ_SYSTEM_PROMPT = `You are a bilingual academic tutor. Generate exactly 4 multiple-choice questions in Arabic based on the provided lecture slide content. Return ONLY valid JSON with no extra text. Format: { "questions": [{ "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }] }. Questions and options must be in Arabic. Keep English technical terms bold in explanations.`

export async function generateQuiz(slideText) {
  const raw = await callGemini(QUIZ_SYSTEM_PROMPT, slideText, true)
  try {
    const parsed = JSON.parse(raw)
    return parsed.questions ?? []
  } catch {
    throw new Error('Failed to parse quiz response. Try regenerating.')
  }
}
