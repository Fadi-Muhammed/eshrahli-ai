import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { generateQuiz, generateGlossary } from '../../api/ai'
import { useQuiz, useUpsertQuiz } from '../../hooks/useQuizzes'
import { useLanguage } from '../LanguageContext'
import { GraduationCap, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { processChildren } from './ArabicWordTooltip'

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

function QuizQuestion({ question, index, glossary }) {
  const [selected, setSelected] = useState(null)
  const answered = selected !== null
  const markdownComponents = useMemo(() => makeMarkdownComponents(glossary), [glossary])

  return (
    <div className="bg-white border border-border rounded-lg p-4">
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
        <div className="mt-3 bg-secondary rounded-md px-3 py-2 text-sm text-foreground" dir="rtl">
          <span className="me-1">💡</span>
          <ReactMarkdown components={markdownComponents}>
            {question.explanation}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default function QuizPanel({ slide }) {
  const { t } = useLanguage()
  const { data: savedQuiz } = useQuiz(slide.id)
  const upsertQuiz = useUpsertQuiz()

  const [questions, setQuestions] = useState(savedQuiz?.questions ?? null)
  const [generating, setGenerating] = useState(false)
  const [glossary, setGlossary] = useState({})

  const displayed = questions ?? savedQuiz?.questions

  // Build glossary from all explanations combined
  const buildGlossary = (qs) => {
    const combined = qs.map((q) => q.explanation ?? '').join(' ')
    if (combined.trim()) {
      generateGlossary(combined).then(setGlossary).catch(() => {})
    }
  }

  // Load glossary for saved quiz on mount
  useMemo(() => {
    if (savedQuiz?.questions) buildGlossary(savedQuiz.questions)
  }, [savedQuiz?.questions])

  const handleGenerate = async () => {
    if (!slide.original_text) {
      toast.error('This slide has no text content.')
      return
    }
    setGenerating(true)
    setGlossary({})
    try {
      const qs = await generateQuiz(slide.original_text)
      setQuestions(qs)
      await upsertQuiz.mutateAsync({ slideId: slide.id, questions: qs })
      toast.success('Quiz generated!')
      buildGlossary(qs)
    } catch (err) {
      toast.error(err.message ?? 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

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
          {displayed ? <><RefreshCw size={13} /> Regenerate</> : t('generateQuiz')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {!generating && !displayed && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <GraduationCap size={24} className="mx-auto mb-2 opacity-40" />
            <p>Generate a quiz to test your understanding.</p>
          </div>
        )}

        {generating && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-border rounded-lg p-4 animate-pulse">
                <div className="h-3 bg-muted rounded w-3/4 mb-3" />
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-8 bg-muted rounded mb-2" />
                ))}
              </div>
            ))}
          </div>
        )}

        {!generating && displayed?.map((q, i) => (
          <QuizQuestion key={i} question={q} index={i} glossary={glossary} />
        ))}
      </div>
    </div>
  )
}
