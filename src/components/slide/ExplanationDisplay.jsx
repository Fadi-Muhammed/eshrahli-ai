import { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { generateExplanation, generateGlossary } from '../../api/ai'
import { useExplanation, useUpsertExplanation } from '../../hooks/useExplanations'
import { useLanguage } from '../LanguageContext'
import { Sparkles, RefreshCw, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { processChildren } from './ArabicWordTooltip'

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-6 px-2 justify-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: '#00C2CB' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function ExplanationDisplay({ slide }) {
  const { t } = useLanguage()
  const { data: savedExplanation } = useExplanation(slide.id)
  const upsert = useUpsertExplanation()
  const [generating, setGenerating] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [generatingGlossary, setGeneratingGlossary] = useState(false)

  const displayed = generating ? streamingText : (savedExplanation?.arabic_explanation ?? streamingText)
  // Use saved glossary from DB, fall back to empty
  const glossary = savedExplanation?.glossary ?? {}

  const handleGenerate = async () => {
    if (!slide.original_text?.trim()) {
      toast.error('This slide has no text content to explain.')
      return
    }
    setGenerating(true)
    setStreamingText('')
    try {
      const result = await generateExplanation(slide.original_text, (partial) => {
        setStreamingText(partial)
      })

      // Generate glossary then save both together
      setGeneratingGlossary(true)
      const glossaryResult = await generateGlossary(result).catch(() => ({}))
      setGeneratingGlossary(false)

      await upsert.mutateAsync({
        slideId: slide.id,
        courseId: slide.course_id,
        arabicExplanation: result,
        glossary: glossaryResult,
      })
      setStreamingText('')
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      toast.error(err.message ?? 'Generation failed. Try again.')
    } finally {
      setGenerating(false)
      setGeneratingGlossary(false)
    }
  }

  const markdownComponents = useMemo(() => ({
    strong: ({ children }) => (
      <strong style={{ color: '#00C2CB', fontWeight: 700 }}>
        {processChildren(children, glossary)}
      </strong>
    ),
    p: ({ children }) => <p>{processChildren(children, glossary)}</p>,
    li: ({ children }) => <li>{processChildren(children, glossary)}</li>,
  }), [glossary])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleGenerate}
          disabled={generating || generatingGlossary}
          className="flex items-center gap-2 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-all"
          style={{ background: (generating || generatingGlossary) ? '#aaa' : '#00C2CB' }}
        >
          {generating ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : displayed ? (
            <RefreshCw size={13} />
          ) : (
            <Sparkles size={13} />
          )}
          {generatingGlossary ? 'Building tooltips…' : displayed ? t('regenerate') : t('generateExplanation')}
        </motion.button>

        <AnimatePresence>
          {justSaved && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-green-600 font-medium"
            >
              <CheckCircle size={12} /> Auto-saved
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {!generating && !displayed && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-muted-foreground text-sm"
          >
            <Sparkles size={22} className="mx-auto mb-2 opacity-30" />
            <p>Generate an explanation to study this slide in Arabic.</p>
          </motion.div>
        )}

        {generating && !streamingText && (
          <motion.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TypingDots />
          </motion.div>
        )}

        {displayed && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            dir="rtl"
            className="prose prose-sm max-w-none leading-[1.9] text-foreground"
          >
            <ReactMarkdown components={markdownComponents}>{displayed}</ReactMarkdown>
            {generating && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                style={{ background: '#00C2CB' }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
