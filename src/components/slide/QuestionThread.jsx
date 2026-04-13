import { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { answerQuestion, generateGlossary } from '../../api/ai'
import { useQuestions, useCreateQuestion } from '../../hooks/useQuestions'
import { useLanguage } from '../LanguageContext'
import { Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { processChildren } from './ArabicWordTooltip'

function makeMarkdownComponents(glossary) {
  return {
    strong: ({ children }) => (
      <strong style={{ color: '#00C2CB', fontWeight: 700 }}>
        {processChildren(children, glossary)}
      </strong>
    ),
    p: ({ children }) => <p>{processChildren(children, glossary)}</p>,
    li: ({ children }) => <li>{processChildren(children, glossary)}</li>,
  }
}

function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-3 py-2.5 bg-white border border-border rounded-2xl rounded-bl-none w-fit">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#00C2CB' }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// Per-answer glossary wrapper
function AnswerBubble({ answerText }) {
  const [glossary, setGlossary] = useState({})

  useEffect(() => {
    if (answerText) {
      generateGlossary(answerText).then(setGlossary).catch(() => {})
    }
  }, [answerText])

  const markdownComponents = useMemo(() => makeMarkdownComponents(glossary), [glossary])

  return (
    <div dir="rtl" className="bg-white border border-border px-3 py-2.5 rounded-2xl rounded-bl-none text-sm max-w-[85%] prose prose-sm">
      <ReactMarkdown components={markdownComponents}>{answerText}</ReactMarkdown>
    </div>
  )
}

export default function QuestionThread({ slide }) {
  const { t } = useLanguage()
  const { data: questions = [] } = useQuestions(slide.id)
  const createQuestion = useCreateQuestion()
  const [input, setInput] = useState('')
  const [answering, setAnswering] = useState(false)
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions, answering, streamingAnswer])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || answering) return
    setInput('')
    setPendingQuestion(q)
    setAnswering(true)
    setStreamingAnswer('')
    try {
      const answer = await answerQuestion(
        slide.original_text ?? '',
        q,
        questions,
        (partial) => setStreamingAnswer(partial)
      )
      await createQuestion.mutateAsync({
        slideId: slide.id,
        questionText: q,
        answerText: answer,
      })
      setStreamingAnswer('')
      setPendingQuestion('')
    } catch (err) {
      toast.error(err.message ?? 'Failed to get answer')
      setPendingQuestion('')
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

  // Streaming answer uses simple markdown components (no glossary yet — it's still being typed)
  const streamingComponents = useMemo(() => makeMarkdownComponents({}), [])

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
        {questions.length === 0 && !answering && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageCircle size={22} className="mx-auto mb-2 opacity-30" />
            <p>Ask a follow-up question about this slide.</p>
          </div>
        )}

        {questions.map((q) => (
          <div key={q.id} className="flex flex-col gap-2">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-none text-sm max-w-[85%]">
                {q.question_text}
              </div>
            </div>
            <div className="flex justify-start">
              <AnswerBubble answerText={q.answer_text} />
            </div>
          </div>
        ))}

        {answering && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-br-none text-sm max-w-[85%]">
                {pendingQuestion}
              </div>
            </div>
            <div className="flex justify-start">
              {streamingAnswer ? (
                <div dir="rtl" className="bg-white border border-border px-3 py-2.5 rounded-2xl rounded-bl-none text-sm max-w-[85%] prose prose-sm">
                  <ReactMarkdown components={streamingComponents}>{streamingAnswer}</ReactMarkdown>
                  <span
                    className="inline-block w-0.5 h-3.5 ml-0.5 align-middle animate-pulse"
                    style={{ background: '#00C2CB' }}
                  />
                </div>
              ) : (
                <TypingDots />
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border pt-3 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('askQuestion')}
          rows={2}
          disabled={answering}
          className="flex-1 resize-none border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          dir="auto"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSend}
          disabled={!input.trim() || answering}
          className="p-2.5 rounded-lg text-white hover:opacity-90 disabled:opacity-40 shrink-0 transition-opacity"
          style={{ background: '#00C2CB' }}
          aria-label={t('send')}
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  )
}
