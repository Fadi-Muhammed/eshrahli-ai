const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(prompt, jsonMode = false) {
  const res = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
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

export async function generateExplanation(slideText) {
  return callGemini(`أنت مدرس تعليمي متخصص. اشرح المحتوى التالي باللغة العربية بأسلوب واضح ومفيد للطلاب.
ضع المصطلحات التقنية الإنجليزية بين علامتي نجمة مزدوجة مثل **term** للتمييز.
لا تكرر المحتوى كما هو، بل اشرحه وبسّطه.

المحتوى:
${slideText}`)
}

export async function answerQuestion(slideText, question, history = []) {
  const historyStr = history
    .map((q) => `س: ${q.question_text}\nج: ${q.answer_text}`)
    .join('\n\n')

  return callGemini(`أنت مساعد تعليمي. أجب على سؤال الطالب باللغة العربية بناءً على محتوى الشريحة.
ضع المصطلحات الإنجليزية بين **نجمتين**.

محتوى الشريحة:
${slideText}

${historyStr ? `محادثة سابقة:\n${historyStr}\n` : ''}
سؤال الطالب: ${question}`)
}

export async function generateQuiz(slideText) {
  const raw = await callGemini(`أنت مدرس. أنشئ اختباراً من 4 أسئلة متعددة الاختيار باللغة العربية عن المحتوى التالي.
أعد النتيجة بصيغة JSON فقط، لا تضف أي نص خارج JSON.

المطلوب:
{
  "questions": [
    {
      "question": "نص السؤال",
      "options": ["خيار أ", "خيار ب", "خيار ج", "خيار د"],
      "correct": 0,
      "explanation": "تفسير الإجابة الصحيحة"
    }
  ]
}

المحتوى:
${slideText}`, true)

  try {
    const parsed = JSON.parse(raw)
    return parsed.questions ?? []
  } catch {
    throw new Error('Failed to parse quiz response. Try again.')
  }
}
