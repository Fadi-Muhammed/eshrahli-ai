import OpenAI from 'openai'

const MODEL = 'openai/gpt-4o-mini'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': 'https://eshrahli.ai',
    'X-Title': 'Eshrahli AI',
  },
})

// ─── Retry helper ─────────────────────────────────────────────────────────────
async function withRetry(fn, retries = 3, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes('429')
      if (is429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)))
        continue
      }
      throw err
    }
  }
}

// ─── Streaming helper ─────────────────────────────────────────────────────────
async function streamChat(systemPrompt, userContent, onChunk) {
  const stream = await withRetry(() => client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    stream: true,
  }))

  let full = ''
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content
    if (token) {
      full += token
      onChunk?.(full)
    }
  }
  return full
}

// ─── Non-streaming helper (for JSON responses) ────────────────────────────────
async function chat(systemPrompt, userContent) {
  const res = await withRetry(() => client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  }))
  return res.choices[0]?.message?.content ?? ''
}

// ─── Explanation ──────────────────────────────────────────────────────────────
const EXPLANATION_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English, specializing in explaining university-level course material to students whose primary language is Arabic. You will be given the text content from a university lecture slide. Explain the concepts in clear, natural Arabic. Every key English academic or technical term must remain in English and be wrapped in bold formatting. Do not translate technical terms into Arabic — instead, explain them in Arabic around the bolded English word. Write in flowing paragraph form, not bullet points. Keep the explanation between 4 and 6 sentences. End with one Arabic sentence summarizing the main takeaway of the slide. Do not add any information not present in the slide.`

export async function generateExplanation(slideText, onChunk) {
  return streamChat(EXPLANATION_SYSTEM_PROMPT, slideText, onChunk)
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────
const QA_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English. Answer student follow-up questions about university lecture slides in clear, natural Arabic.

Formatting rules:
- Always start with a bold direct answer on its own line: **الجواب:** one sentence.
- If the answer is a single fact, follow with 1–2 sentences of context. Stop there.
- If the answer has multiple parts or steps, follow the direct answer with a short numbered list (max 4 items).
- Never exceed 5 lines total.
- Every key English academic or technical term must remain in English wrapped in **bold**.
- Do not translate technical terms into Arabic.`

export async function answerQuestion(slideText, question, history = [], onChunk) {
  const historyStr = history
    .map((q) => `Student: ${q.question_text}\nTutor: ${q.answer_text}`)
    .join('\n\n')

  const userContent = `Slide content:\n${slideText}\n\n${historyStr ? `Previous Q&A:\n${historyStr}\n\n` : ''}Student question: ${question}`

  return streamChat(QA_SYSTEM_PROMPT, userContent, onChunk)
}

// ─── Quiz (non-streaming — needs full JSON) ───────────────────────────────────
const QUIZ_SYSTEM_PROMPT = `You are a bilingual academic tutor. Generate exactly 4 multiple-choice questions in Arabic based on the provided lecture slide content. Return ONLY valid JSON with no extra text, markdown, or code fences. Format: { "questions": [{ "question": "...", "options": ["...", "...", "...", "..."], "correct": 0, "explanation": "..." }] }. Questions and options must be in Arabic. Keep English technical terms bold in explanations.`

// ─── Glossary (Arabic word → English translation) ────────────────────────────
const GLOSSARY_SYSTEM_PROMPT = `You are a language assistant. Given Arabic text, extract up to 20 meaningful Arabic words (nouns, verbs, key adjectives — skip particles, prepositions, and very common words like هذا، في، من، على، أن، كان، هو). For each word as it appears in the text, provide a concise English translation. Return ONLY valid JSON with no extra text or code fences. Format: { "arabicWord": "english translation", ... }`

export async function generateGlossary(text) {
  const raw = await chat(GLOSSARY_SYSTEM_PROMPT, text)
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

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
