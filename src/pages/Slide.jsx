import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSlides, useSlide } from '../hooks/useSlides'
import { useCourses } from '../hooks/useCourses'
import { useLanguage } from '../components/LanguageContext'
import ExplanationDisplay from '../components/slide/ExplanationDisplay'
import QuestionThread from '../components/slide/QuestionThread'
import QuizPanel from '../components/slide/QuizPanel'
import { ChevronRight, ChevronLeft, ChevronDown, GraduationCap, X } from 'lucide-react'
import { cn } from '../lib/utils'
import ReactMarkdown from 'react-markdown'

// ── Slide nav sidebar item ────────────────────────────────────────────────────
function SlideNavItem({ slide, isActive, courseId }) {
  const navigate = useNavigate()
  const ref = useRef(null)
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [isActive])

  return (
    <button
      ref={ref}
      onClick={() => navigate(`/course/${courseId}/slide/${slide.id}`)}
      className={cn(
        'w-full text-start px-3 py-2.5 text-sm rounded-lg transition-all duration-150',
        isActive
          ? 'bg-primary/10 text-primary font-semibold border-s-[3px] border-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
    >
      <span className="block font-medium">Slide {slide.slide_number}</span>
      {slide.original_text && (
        <span className="block text-xs truncate opacity-55 mt-0.5">
          {slide.original_text.slice(0, 38)}
        </span>
      )}
    </button>
  )
}

// ── Collapsible original content ─────────────────────────────────────────────
function CollapsibleOriginal({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <span>Original Slide Content</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground prose prose-sm max-w-none border-t border-border">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Quiz modal ────────────────────────────────────────────────────────────────
function QuizModal({ slide, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <GraduationCap size={17} style={{ color: '#00C2CB' }} />
            Quiz — Slide {slide.slide_number}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <QuizPanel slide={slide} />
        </div>
      </motion.div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Slide() {
  const { courseId, slideId } = useParams()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slide, isLoading } = useSlide(slideId)
  const { data: slides = [] } = useSlides(courseId)
  const [quizOpen, setQuizOpen] = useState(false)
  const navigate = useNavigate()

  const course = courses?.find((c) => c.id === courseId)
  const displayCourseName = course ? (language === 'ar' ? course.name_ar : course.name) : '…'
  const currentIndex = slides.findIndex((s) => s.id === slideId)
  const prevSlide = currentIndex > 0 ? slides[currentIndex - 1] : null
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null

  const isPDF = slide?.file_url && (slide.file_name?.endsWith('.pdf') || slide.file_url?.includes('.pdf'))

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' && prevSlide) navigate(`/course/${courseId}/slide/${prevSlide.id}`)
      if (e.key === 'ArrowRight' && nextSlide) navigate(`/course/${courseId}/slide/${nextSlide.id}`)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevSlide, nextSlide, courseId, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!slide) {
    return (
      <div className="text-center py-24 text-muted-foreground text-sm">
        Slide not found.{' '}
        <Link to={`/course/${courseId}`} className="text-primary hover:underline">Back to course</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 72px - 24px)' }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3 shrink-0 flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">{t('dashboard')}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <Link to={`/course/${courseId}`} className="hover:text-primary transition-colors">{displayCourseName}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <span className="text-foreground font-medium">Slide {slide.slide_number}</span>
      </nav>

      <div className="flex gap-3 flex-1 min-h-0">

        {/* ── Col 1: Slide navigation list ── */}
        <div className="hidden lg:flex flex-col w-44 xl:w-52 shrink-0 bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {slides.length} {t('slides')}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {slides.map((s) => (
              <SlideNavItem key={s.id} slide={s} isActive={s.id === slideId} courseId={courseId} />
            ))}
          </div>
        </div>

        {/* ── Col 2: Slide content (PDF iframe or text) ── */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-border rounded-xl overflow-hidden flex-1 flex flex-col"
            >
              {/* Slide header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Slide {slide.slide_number} of {slides.length}
                </span>
                <div className="flex items-center gap-2">
                  {slide.file_name && (
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">{slide.file_name}</span>
                  )}
                  {/* Quiz button — per spec, prominent but not a tab */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setQuizOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                    style={{ color: '#00C2CB' }}
                  >
                    <GraduationCap size={14} />
                    {t('quiz')}
                  </motion.button>
                </div>
              </div>

              {/* PDF iframe or text */}
              <div className="flex-1 overflow-hidden">
                {isPDF && slide.file_url ? (
                  <iframe
                    src={`${slide.file_url}#page=${slide.slide_number}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                    className="w-full h-full border-0"
                    title={`Slide ${slide.slide_number}`}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-5">
                    <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                      {slide.original_text
                        ? <ReactMarkdown>{slide.original_text}</ReactMarkdown>
                        : <p className="text-muted-foreground italic text-sm">No text content for this slide.</p>
                      }
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next */}
          <div className="flex items-center justify-between shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!prevSlide}
              onClick={() => prevSlide && navigate(`/course/${courseId}/slide/${prevSlide.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">{t('previous')}</span>
            </motion.button>
            <span className="text-sm text-muted-foreground font-medium tabular-nums">
              {currentIndex + 1} / {slides.length}
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!nextSlide}
              onClick={() => nextSlide && navigate(`/course/${courseId}/slide/${nextSlide.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <span className="hidden sm:inline">{t('next')}</span>
              <ChevronRight size={15} />
            </motion.button>
          </div>
        </div>

        {/* ── Col 3: AI panel — Explanation + Q&A (spec layout) ── */}
        <div className="flex flex-col w-80 xl:w-96 shrink-0 bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Explanation section */}
            <div className="p-4 border-b border-border">
              <ExplanationDisplay slide={slide} />

              {/* Collapsible original content — per spec */}
              {slide.original_text && (
                <div className="mt-4">
                  <CollapsibleOriginal text={slide.original_text} />
                </div>
              )}
            </div>

            {/* Q&A section — below explanation, per spec */}
            <div className="flex-1 flex flex-col min-h-0 p-4" style={{ minHeight: 280 }}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Follow-Up Questions
              </p>
              <QuestionThread slide={slide} />
            </div>

          </div>
        </div>

      </div>

      {/* Quiz modal */}
      <AnimatePresence>
        {quizOpen && <QuizModal slide={slide} onClose={() => setQuizOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
