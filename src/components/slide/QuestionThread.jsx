import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { answerQuestion } from '../../api/gemini'
import { useQuestions, useCreateQuestion } from '../../hooks/useQuestions'
import { useLanguage } from '../LanguageContext'
import { Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-3 py-2 bg-white border border-border rounded-2xl rounded-bl-none w-fit max-w-[80%]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function QuestionThread({ slide }) {
  const { t } = useLanguage()
  const { data: questions = [] } = useQuestions(slide.id)
  const createQuestion = useCreateQuestion()
  const [input, setInput] = useState('')
  const [answering, setAnswering] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions, answering])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || answering) return
    setInput('')
    setAnswering(true)
    try {
      const answer = await answerQuestion(slide.original_text ?? '', q, questions)
      await createQuestion.mutateAsync({
        slideId: slide.id,
        questionText: q,
        answerText: answer,
      })
    } catch (err) {
      toast.error(err.message ?? 'Failed to get answer')
    } finally {
      setAnswering(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
        {questions.length === 0 && !answering && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <MessageCircle size={24} className="mx-auto mb-2 opacity-40" />
            <p>Ask anything about this slide.</p>
          </div>
        )}

        {questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            {/* Question bubble (student — right) */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-none text-sm max-w-[80%]">
                {q.question_text}
              </div>
            </div>
            {/* Answer bubble (tutor — left) */}
            <div className="flex justify-start">
              <div
                dir="rtl"
                className="bg-white border border-border px-3 py-2 rounded-2xl rounded-bl-none text-sm max-w-[80%] prose prose-sm"
              >
                <ReactMarkdown>{q.answer_text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {answering && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-none text-sm max-w-[80%] opacity-60">
                {input || '...'}
              </div>
            </div>
            <div className="flex justify-start">
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-border pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('askQuestion')}
          rows={2}
          className="flex-1 resize-none border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          dir="auto"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || answering}
          className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40 shrink-0"
          aria-label={t('send')}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
