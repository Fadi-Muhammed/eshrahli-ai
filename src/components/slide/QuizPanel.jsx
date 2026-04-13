import { useState, useMemo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { generateSingleQuestion, generateGlossary } from '../../api/ai'
import { useQuiz, useUpsertQuiz } from '../../hooks/useQuizzes'
import { useLanguage } from '../LanguageContext'
import { GraduationCap, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { processChildren } from './ArabicWordTooltip'

const TOTAL = 4

function makeMarkdownComponents(glossary) {
  return {
    strong: ({ children }) => (
      <strong style={{ color: '#00C2CB', fontWeight: 700 }}>
        {processChildren(children, glossary)}
      </strong>
    ),
    p: ({ children }) => <span>{processChildren(children, glossary)}</span>,
  }
}

function QuizQuestion({ question, index }) {
  const [selected, setSelected] = useState(null)
  const answered = selected !== null
  const glossary = question.glossary ?? {}
  const markdownComponents = useMemo(() => makeMarkdownComponents(glossary), [glossary])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="bg-white border border-border rounded-lg p-4"
    >
      <p className="text-sm font-medium text-foreground mb-3" dir="rtl">
        {index + 1}. {question.question}
      </p>

      <div className="flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct
          const isSelected = i === selected

          let optionClass = 'border border-border rounded-md px-3 py-2 text-sm cursor-pointer transition-colors text-start w-full'
          if (!answered) optionClass += ' hover:bg-muted'
          if (answered && isCorrect) optionClass += ' bg-green-50 border-green-400 text-green-800'
          else if (answered && isSelected && !isCorrect) optionClass += ' bg-red-50 border-red-400 text-red-800'
          else if (answered) optionClass += ' opacity-60'

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={optionClass}
              dir="rtl"
            >
              <span className="font-medium me-2">{['أ', 'ب', 'ج', 'د'][i]}.</span>
              {option}
              {answered && isCorrect && <CheckCircle size={14} className="inline ms-2 text-green-600" />}
              {answered && isSelected && !isCorrect && <XCircle size={14} className="inline ms-2 text-red-600" />}
            </button>
          )
        })}
      </div>

      {answered && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 bg-secondary rounded-md px-3 py-2 text-sm text-foreground overflow-hidden"
          dir="rtl"
        >
          <span className="me-1">💡</span>
          <ReactMarkdown components={markdownComponents}>{question.explanation}</ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  )
}

function QuestionSkeleton({ index }) {
  return (
    <motion.div
      key={`skeleton-${index}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="bg-white border border-border rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-3.5 h-3.5 border-2 border-[#00C2CB] border-t-transparent rounded-full animate-spin shrink-0" />
        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
      </div>
      {[1, 2, 3, 4].map((j) => (
        <div key={j} className="h-8 bg-muted rounded mb-2 animate-pulse" />
      ))}
    </motion.div>
  )
}

export default function QuizPanel({ slide }) {
  const { t } = useLanguage()
  const { data: savedQuiz } = useQuiz(slide.id)
  const upsertQuiz = useUpsertQuiz()

  // questions: array of { ...questionData, glossary, _loading: bool }
  const [questions, setQuestions] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // On mount load saved questions
  useEffect(() => {
    if (savedQuiz?.questions && !questions) {
      setQuestions(savedQuiz.questions)
    }
  }, [savedQuiz])

  const handleGenerate = async () => {
    if (!slide.original_text) {
      toast.error('This slide has no text content.')
      return
    }
    setGenerating(true)
    setPendingCount(TOTAL)
    // Start with TOTAL loading skeletons
    setQuestions(Array.from({ length: TOTAL }, (_, i) => ({ _loading: true, _index: i })))

    const results = Array(TOTAL).fill(null)

    const promises = Array.from({ length: TOTAL }, (_, i) =>
      generateSingleQuestion(slide.original_text, i)
        .then(async (q) => {
          // Generate glossary for this question immediately
          const glossary = q.explanation
            ? await generateGlossary(q.explanation).catch(() => ({}))
            : {}
          const fullQ = { ...q, glossary }
          results[i] = fullQ
          // Replace the skeleton at position i with the real question
          setQuestions((prev) => {
            const next = [...prev]
            next[i] = fullQ
            return next
          })
          setPendingCount((c) => c - 1)
          return fullQ
        })
        .catch((err) => {
          // Remove skeleton on failure, show toast
          setQuestions((prev) => {
            const next = [...prev]
            next[i] = null
            return next
          })
          setPendingCount((c) => c - 1)
          toast.error(err.message ?? `Question ${i + 1} failed`)
          return null
        })
    )

    await Promise.all(promises)

    const finalQuestions = results.filter(Boolean)
    if (finalQuestions.length > 0) {
      try {
        await upsertQuiz.mutateAsync({ slideId: slide.id, questions: finalQuestions, glossary: {} })
      } catch {
        // save failure is non-critical
      }
    }

    setGenerating(false)
  }

  const displayedQuestions = questions?.filter(Boolean) ?? []
  const hasAny = displayedQuestions.length > 0 || generating

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {generating ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <GraduationCap size={14} />
          )}
          {generating
            ? `Generating… (${TOTAL - pendingCount}/${TOTAL})`
            : hasAny
            ? <><RefreshCw size={13} className="inline" /> Regenerate</>
            : t('generateQuiz')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {!generating && !hasAny && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <GraduationCap size={24} className="mx-auto mb-2 opacity-40" />
            <p>Generate a quiz to test your understanding.</p>
          </div>
        )}

        <AnimatePresence>
          {questions?.map((q, i) =>
            q?._loading
              ? <QuestionSkeleton key={`sk-${i}`} index={i} />
              : q
              ? <QuizQuestion key={`q-${i}`} question={q} index={i} />
              : null
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
