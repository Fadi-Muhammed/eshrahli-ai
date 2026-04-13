import { MessageSquare, Sparkles, Star, GraduationCap } from 'lucide-react'
import { useExplanation } from '../../hooks/useExplanations'
import { useQuestions } from '../../hooks/useQuestions'
import { useQuiz } from '../../hooks/useQuizzes'
import { cn } from '../../lib/utils'

function Pill({ icon: Icon, label, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', className)}>
      <Icon size={11} />
      {label}
    </span>
  )
}

export default function SlideStatusPills({ slideId, isFavorite = false }) {
  const { data: explanation } = useExplanation(slideId)
  const { data: quiz } = useQuiz(slideId)
  const { data: questions = [] } = useQuestions(slideId)

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {explanation && (
        <Pill icon={Sparkles} label="Explained" className="bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/20" />
      )}
      {!!quiz && (
        <Pill icon={GraduationCap} label="Quiz" className="bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-300 dark:ring-sky-400/20" />
      )}
      {questions.length > 0 && (
        <Pill icon={MessageSquare} label={`${questions.length} Q&A`} className="bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-400/15 dark:text-indigo-300 dark:ring-indigo-400/20" />
      )}
      {isFavorite && (
        <Pill icon={Star} label="Favorite" className="bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/20" />
      )}
    </div>
  )
}
