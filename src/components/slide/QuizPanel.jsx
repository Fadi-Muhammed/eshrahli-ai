import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateSingleQuestion, generateGlossary } from '../../api/ai'
import { useQuiz, useUpsertQuiz } from '../../hooks/useQuizzes'
import { useLanguage } from '../LanguageContext'
import { GraduationCap, RefreshCw } from 'lucide-react'
import { renderInline } from './ArabicWordTooltip'

const TOTAL = 4
const LABELS = ['A', 'B', 'C', 'D']

// ─── Single question card ─────────────────────────────────────────────────────
function QuizQuestion({ question, index }) {
  const [selected, setSelected] = useState(null)
  const answered = selected !== null
  const glossary = question.glossary ?? {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
    >
      {/* Question header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-foreground leading-relaxed flex-1" dir="rtl">
            {renderInline(question.question, glossary, `q${index}`)}
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="p-3 flex flex-col gap-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correct
          const isSelected = i === selected

          let base = 'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-start transition-all duration-150 border'
          if (!answered) {
            base += ' border-border hover:border-[#00C2CB]/50 hover:bg-[#00C2CB]/5 cursor-pointer'
          } else if (isCorrect) {
            base += ' border-green-500/70 bg-green-500/10 text-green-700 dark:text-green-300 cursor-default'
          } else if (isSelected) {
            base += ' border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300 cursor-default'
          } else {
            base += ' border-border bg-muted/30 opacity-50 cursor-default'
          }

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={base}
              dir="rtl"
            >
              {/* Label badge */}
              <span
                className={`shrink-0 w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                  !answered
                    ? 'bg-muted text-muted-foreground'
                    : isCorrect
                    ? 'bg-green-500 text-white'
                    : isSelected
                    ? 'bg-red-400 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {LABELS[i]}
              </span>
              <span className="flex-1" dir="rtl">
                {renderInline(option, glossary, `q${index}o${i}`)}
              </span>
              {answered && isCorrect && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="shrink-0 text-green-500 text-base"
                >
                  ✓
                </motion.span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="shrink-0 text-red-400 text-base">✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Explanation — revealed after answering */}
      <AnimatePresence>
        {answered && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mb-3 rounded-lg bg-[#00C2CB]/6 border border-[#00C2CB]/20 px-3 py-2.5" dir="rtl">
              <div className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="text-base shrink-0 mt-0.5">💡</span>
                <span>{renderInline(question.explanation, glossary, `q${index}exp`)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function QuestionSkeleton({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
    >
      <div className="px-4 pt-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded animate-pulse w-5/6" />
            <div className="h-3 bg-muted rounded animate-pulse w-3/6" />
          </div>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {[0, 1, 2, 3].map((j) => (
          <div key={j} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border">
            <div className="w-6 h-6 rounded-md bg-muted animate-pulse shrink-0" />
            <div className="h-3 bg-muted rounded animate-pulse flex-1" style={{ width: `${55 + j * 8}%` }} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function QuizPanel({ slide }) {
  const { t } = useLanguage()
  const { data: savedQuiz } = useQuiz(slide.id)
  const upsertQuiz = useUpsertQuiz()

  // slots[i]: { _loading: true } while pending, question object when done
  const [slots, setSlots] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (savedQuiz?.questions && !slots && !generating) {
      setSlots(savedQuiz.questions)
    }
  }, [savedQuiz])

  const readyCount = useMemo(
    () => slots?.filter((s) => s && !s._loading).length ?? 0,
    [slots]
  )

  const generateOne = async (index) => {
    // generateSingleQuestion never throws — has internal retry + fallback
    const q = await generateSingleQuestion(slide.original_text, index)
    const glossary = q.explanation
      ? await generateGlossary(q.explanation).catch(() => ({}))
      : {}
    const fullQ = { ...q, glossary }
    setSlots((prev) => {
      const next = [...prev]
      next[index] = fullQ
      return next
    })
    return fullQ
  }

  const handleGenerate = async () => {
    if (!slide.original_text) return
    setGenerating(true)
    setSlots(Array.from({ length: TOTAL }, () => ({ _loading: true })))

    const results = await Promise.all(
      Array.from({ length: TOTAL }, (_, i) => generateOne(i))
    )

    upsertQuiz.mutateAsync({ slideId: slide.id, questions: results, glossary: {} }).catch(() => {})
    setGenerating(false)
  }

  // Show questions in order — skeleton holds if predecessor not yet ready
  const orderedSlots = useMemo(() => {
    if (!slots) return []
    const result = []
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]
      if (!s || s._loading) {
        result.push({ type: 'loading', index: i })
        break
      }
      result.push({ type: 'question', index: i, data: s })
    }
    return result
  }, [slots])

  const hasContent = slots && slots.length > 0

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {generating ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : hasContent ? (
            <RefreshCw size={13} />
          ) : (
            <GraduationCap size={14} />
          )}
          {generating
            ? `${readyCount}/${TOTAL} ready…`
            : hasContent
            ? 'Regenerate'
            : t('generateQuiz')}
        </button>

        {generating && (
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: TOTAL }, (_, i) => {
              const done = slots?.[i] && !slots[i]._loading
              return (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    done ? 'bg-[#00C2CB]' : 'bg-muted-foreground/25'
                  }`}
                  animate={done ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
        {!hasContent && !generating && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <GraduationCap size={28} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No quiz yet</p>
            <p className="text-xs mt-1 opacity-70">Generate a quiz to test your understanding of this slide.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {orderedSlots.map((slot) =>
            slot.type === 'loading'
              ? <QuestionSkeleton key={`sk-${slot.index}`} index={slot.index} />
              : <QuizQuestion key={`q-${slot.index}`} question={slot.data} index={slot.index} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
