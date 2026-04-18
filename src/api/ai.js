import OpenAI from 'openai'

const MODEL = 'openai/gpt-4o-mini'

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': 'https://eshrahli.ai',
    'X-Title': 'Eshrahli',
  },
})

// ─── Sleep ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Retry — handles 429 and transient errors with backoff ───────────────────
async function withRetry(fn, retries = 5, baseDelay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const is429 = err?.status === 429 || String(err?.message).includes('429')
      const isTransient = is429 || err?.status >= 500
      if (isTransient && i < retries - 1) {
        await sleep(baseDelay * Math.pow(1.8, i))
        continue
      }
      throw err
    }
  }
}

// ─── Bulletproof JSON extractor ───────────────────────────────────────────────
// Tries multiple strategies to pull a valid JSON object out of model output
function extractJSON(raw) {
  // 1. Strip code fences
  let text = raw.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim()

  // 2. Direct parse
  try { return JSON.parse(text) } catch {}

  // 3. Find first { ... } block (handles leading/trailing prose)
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }

  // 4. Fix common model mistakes: single quotes, trailing commas
  try {
    const fixed = text
      .replace(/'/g, '"')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
    return JSON.parse(fixed)
  } catch {}

  return null
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

// ─── Non-streaming helper ─────────────────────────────────────────────────────
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

// ─── Vision-based slide text extraction (OCR fallback for upload pipeline) ────
const OCR_SYSTEM_PROMPT = `You are an OCR assistant. Extract ALL visible text from this lecture slide image. Include:
- Titles, headings, subheadings
- Bullet points and body text
- Text inside diagrams, figures, charts, and tables
- Labels, captions, and annotations
Return ONLY the raw extracted text, preserving the logical reading order. No commentary.`

export async function extractTextFromSlideImage(imageDataUrl) {
  const res = await withRetry(() => client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: OCR_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [{ type: 'image_url', image_url: { url: imageDataUrl } }],
      },
    ],
  }))
  return (res.choices[0]?.message?.content ?? '').trim()
}

// ─── Slide enrichment (runs on slide open, stored in DB) ─────────────────────
const ENRICH_MODEL = 'google/gemma-4-26b-a4b-it'

const ENRICH_SYSTEM_PROMPT = `You are an academic content extractor. Extract ALL important information from this lecture slide image.
Include: main topic, key concepts and definitions, all bullet points and body text (verbatim), formulas or equations, text inside diagrams and charts, table contents, labels and captions.
Return structured plain text. Be thorough — this will be used by a tutoring AI to explain, answer questions, and generate quizzes about this slide.`

export async function extractSlideInfo(imageDataUrl) {
  const res = await withRetry(() => client.chat.completions.create({
    model: ENRICH_MODEL,
    messages: [
      { role: 'system', content: ENRICH_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [{ type: 'image_url', image_url: { url: imageDataUrl } }],
      },
    ],
  }))
  return (res.choices[0]?.message?.content ?? '').trim()
}

// ─── Explanation ──────────────────────────────────────────────────────────────
const EXPLANATION_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English, specializing in explaining university-level course material to students whose primary language is Arabic. You will be given the text content from a university lecture slide. Explain the concepts in clear, natural Arabic. Every key English academic or technical term must remain in English and be wrapped in bold formatting. Do not translate technical terms into Arabic — instead, explain them in Arabic around the bolded English word. Write in flowing paragraph form, not bullet points. Keep the explanation between 4 and 6 sentences. End with one Arabic sentence summarizing the main takeaway of the slide. Do not add any information not present in the slide. Render any mathematical expressions using LaTeX notation (e.g. $V_{emf}$ for inline, $$E=mc^2$$ for block).`

export async function generateExplanation(slideText, onChunk) {
  return streamChat(EXPLANATION_SYSTEM_PROMPT, slideText, onChunk)
}

// ─── Q&A ──────────────────────────────────────────────────────────────────────
const QA_SYSTEM_PROMPT = `You are a bilingual academic tutor fluent in Arabic and English. Answer student follow-up questions using ONLY the information present in the provided slide content. Do not use outside knowledge.

LANGUAGE RULE — MOST IMPORTANT:
- ALWAYS answer in Arabic by default, regardless of the language the student used to ask the question.
- Even if the student asks in English, French, or any other language, your entire answer MUST be written in Arabic.
- The ONLY exceptions are English academic/technical terms, which must stay in English wrapped in **bold** (do not translate them).

If the answer is not found in the slide content, respond in Arabic: "هذه المعلومة غير موجودة في الشريحة." and stop.

Formatting rules:
- Always start with a bold direct answer on its own line: **الجواب:** one sentence (in Arabic).
- If the answer is a single fact, follow with 1–2 sentences of context from the slide (in Arabic). Stop there.
- If the answer has multiple parts or steps, follow the direct answer with a short numbered list (max 4 items, in Arabic).
- Never exceed 5 lines total.
- Every key English academic or technical term must remain in English wrapped in **bold**.
- Do not translate technical terms into Arabic.
- Render any mathematical expressions using LaTeX notation (e.g. $V_{emf}$).`

export async function answerQuestion(slideText, question, history = [], onChunk) {
  const historyStr = history
    .map((q) => `Student: ${q.question_text}\nTutor: ${q.answer_text}`)
    .join('\n\n')

  const userContent = `Slide content:\n${slideText}\n\n${historyStr ? `Previous Q&A:\n${historyStr}\n\n` : ''}Student question: ${question}`

  return streamChat(QA_SYSTEM_PROMPT, userContent, onChunk)
}

// ─── Glossary ─────────────────────────────────────────────────────────────────
const GLOSSARY_SYSTEM_PROMPT = `You are a language assistant. Given Arabic text, extract up to 20 meaningful Arabic words (nouns, verbs, key adjectives — skip particles, prepositions, and very common words like هذا، في، من، على، أن، كان، هو). For each word as it appears in the text, provide a concise English translation. Return ONLY valid JSON, no prose, no code fences. Format: { "arabicWord": "english translation", ... }`

export async function generateGlossary(text) {
  try {
    const raw = await chat(GLOSSARY_SYSTEM_PROMPT, text)
    return extractJSON(raw) ?? {}
  } catch {
    return {}
  }
}

// ─── Quiz — 4 parallel calls, staggered, with silent per-question retry ───────
const ASPECT_HINTS = [
  'ركز على التعريف الأساسي أو المفهوم الرئيسي في الشريحة.',
  'ركز على تطبيق عملي أو مثال من الواقع.',
  'ركز على مقارنة أو فرق أو علاقة بين المفاهيم.',
  'ركز على السبب أو النتيجة أو خطوات العملية أو التأثير.',
]

// Validate the parsed object has the required shape
function isValidQuestion(obj) {
  return (
    obj &&
    typeof obj.question === 'string' && obj.question.length > 0 &&
    Array.isArray(obj.options) && obj.options.length === 4 &&
    typeof obj.correct === 'number' && obj.correct >= 0 && obj.correct <= 3 &&
    typeof obj.explanation === 'string'
  )
}

export async function generateSingleQuestion(slideText, index) {
  const systemPrompt = `You are a bilingual academic tutor. Generate exactly ONE multiple-choice question in Arabic based on the provided lecture slide content. ${ASPECT_HINTS[index] ?? ''}

STRICT OUTPUT RULES — follow exactly:
- Return ONLY a raw JSON object. No markdown. No code fences. No explanation before or after.
- Schema: { "question": "string", "options": ["string","string","string","string"], "correct": 0, "explanation": "string" }
- "correct" is the zero-based index of the correct option (0, 1, 2, or 3).
- All text must be in Arabic. English technical terms stay in English wrapped in **double asterisks**.`

  // Stagger slightly to avoid simultaneous rate-limit spikes
  await sleep(index * 300)

  // Try up to 4 times silently — user never sees a failure
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const raw = await withRetry(() => client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: slideText },
        ],
      }))
      const text = raw.choices[0]?.message?.content ?? ''
      const parsed = extractJSON(text)
      if (isValidQuestion(parsed)) return parsed
      // Invalid shape — wait briefly and retry
      await sleep(800)
    } catch {
      if (attempt < 3) await sleep(1200 * (attempt + 1))
    }
  }

  // Last-resort fallback: ask model to fix a simpler version
  try {
    const fallbackRaw = await withRetry(() => client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a JSON generator. Output ONLY a valid JSON object, nothing else. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Generate one Arabic multiple-choice question about this text. Return ONLY this exact JSON shape with no other text: {"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}\n\nText: ${slideText.slice(0, 400)}`,
        },
      ],
    }))
    const fallbackText = fallbackRaw.choices[0]?.message?.content ?? ''
    const fallback = extractJSON(fallbackText)
    if (isValidQuestion(fallback)) return fallback
  } catch {}

  // Absolute last resort — return a synthetic placeholder that renders fine
  return {
    question: 'ما هو المفهوم الرئيسي في هذه الشريحة؟',
    options: [
      'المفهوم الأول المذكور في الشريحة',
      'المفهوم الثاني المذكور في الشريحة',
      'مفهوم غير مذكور في الشريحة',
      'لا شيء مما سبق',
    ],
    correct: 0,
    explanation: 'يُرجى مراجعة محتوى الشريحة للإجابة على هذا السؤال.',
    glossary: {},
  }
}
