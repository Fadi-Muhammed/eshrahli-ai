import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { generateExplanation } from '../../api/gemini'
import { useExplanation, useUpsertExplanation } from '../../hooks/useExplanations'
import { useLanguage } from '../LanguageContext'
import { Sparkles, RefreshCw, Save } from 'lucide-react'
import { toast } from 'sonner'

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-4 px-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

export default function ExplanationDisplay({ slide }) {
  const { t } = useLanguage()
  const { data: savedExplanation } = useExplanation(slide.id)
  const upsert = useUpsertExplanation()

  const [draft, setDraft] = useState(null) // unsaved AI output
  const [generating, setGenerating] = useState(false)

  const displayed = draft ?? savedExplanation?.arabic_explanation

  const handleGenerate = async () => {
    if (!slide.original_text) {
      toast.error('This slide has no text content.')
      return
    }
    setGenerating(true)
    setDraft(null)
    try {
      const result = await generateExplanation(slide.original_text)
      setDraft(result)
    } catch (err) {
      toast.error(err.message ?? 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!draft) return
    try {
      await upsert.mutateAsync({
        slideId: slide.id,
        courseId: slide.course_id,
        arabicExplanation: draft,
      })
      toast.success('Explanation saved!')
      setDraft(null)
    } catch (err) {
      toast.error(err.message ?? 'Failed to save')
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Action bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {generating ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {displayed ? t('regenerate') : t('generateExplanation')}
        </button>

        {draft && (
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex items-center gap-2 border border-border px-3 py-1.5 rounded-md text-sm hover:bg-muted disabled:opacity-60"
          >
            <Save size={14} />
            {t('save')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {generating && <TypingDots />}

        {!generating && !displayed && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Sparkles size={24} className="mx-auto mb-2 opacity-40" />
            <p>Press "Generate Explanation" to get an Arabic explanation.</p>
          </div>
        )}

        {!generating && displayed && (
          <div
            dir="rtl"
            className="prose prose-sm max-w-none text-foreground leading-relaxed"
          >
            <ReactMarkdown>{displayed}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
