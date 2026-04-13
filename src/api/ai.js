const MODEL = 'google/gemma-4-31b-it:free'
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

function headers() {
  return {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://eshrahli.ai',
    'X-Title': 'Eshrahli AI',
  }
}

// ─── Streaming helper ─────────────────────────────────────────────────────────
async function streamChat(systemPrompt, userContent, onChunk) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API error ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value, { stream: true }).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const token = json.choices?.[0]?.delta?.content
        if (token) {
          full += token
          onChunk?.(full)
        }
      } catch {
        // malformed chunk, skip
      }
    }
  }

  return full
}

// ─── Non-streaming helper (for JSON responses) ────────────────────────────────
async function chat(systemPrompt, userContent) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API error ${res.status}`)
  }

  const json = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ─── Explanation ──────────────────────────────────────────────────────────────
const EXPLANATION_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English, specializing in explaining university-level course material to students whose primary language is Arabic. You will be given the text content from a university lecture slide. Explain the concepts in clear, natural Arabic. Every key English academic or technical term must remain in English and be wrapped in bold formatting. Do not translate technical terms into Arabic — instead, explain them in Arabic around the bolded English word. Write in flowing paragraph form, not bullet points. Keep the explanation between 4 and 6 sentences. End with one Arabic sentence summarizing the main takeaway of the slide. Do not add any information not present in the slide.`

export async function generateExplanation(slideText, onChunk) {
  return streamChat(EXPLANATION_SYSTEM_PROMPT, slideText, onChunk)
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────
const QA_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English. You answer student follow-up questions about university lecture slides. Always respond in clear, natural Arabic. Every key English academic or technical term must remain in English and be wrapped in bold formatting (**term**). Do not translate technical terms into Arabic. Be concise but thorough.`

export async function answerQuestion(slideText, question, history = [], onChunk) {
  const historyStr = history
    .map((q) => `Student: ${q.question_text}\nTutor: ${q.answer_text}`)
    .join('\n\n')

  const userContent = `Slide content:\n${slideText}\n\n${historyStr ? `Previous Q&A:\n${historyStr}\n\n` : ''}Student question: ${question}`

  return streamChat(QA_SYSTEM_PROMPT, userContent, onChunk)
}

// ─── Quiz (non-streaming — needs full JSON) ───────────────────────────────────
const QUIZ_SYSTEM_PROMPT = `You are a bilingual academic tutor. Generate exactly 4 multiple-choice questions in Arabic based on the provided lecture slide content. Return ONLY valid JSON with no extra text, markdown, or code fences. Format: { "questions": [{ "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }] }. Questions and options must be in Arabic. Keep English technical terms bold in explanations.`

export async function generateQuiz(slideText) {
  const raw = await chat(QUIZ_SYSTEM_PROMPT, slideText)
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return parsed.questions ?? []
  } catch {
    throw new Error('Failed to parse quiz. Try regenerating.')
  }
}
