import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSlides, useSlide } from '../hooks/useSlides'
import { useCourses } from '../hooks/useCourses'
import { useLanguage } from '../components/LanguageContext'
import ExplanationDisplay from '../components/slide/ExplanationDisplay'
import QuestionThread from '../components/slide/QuestionThread'
import QuizPanel from '../components/slide/QuizPanel'
import { ChevronRight, ChevronLeft, Sparkles, MessageCircle, GraduationCap } from 'lucide-react'
import { cn } from '../lib/utils'
import ReactMarkdown from 'react-markdown'

const TABS = [
  { key: 'explanation', labelKey: 'explanation', icon: Sparkles },
  { key: 'qa', labelKey: 'questions', icon: MessageCircle },
  { key: 'quiz', labelKey: 'quiz', icon: GraduationCap },
]

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
        <span className="block text-xs truncate opacity-60 mt-0.5">
          {slide.original_text.slice(0, 38)}
        </span>
      )}
    </button>
  )
}

export default function Slide() {
  const { courseId, slideId } = useParams()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slide, isLoading } = useSlide(slideId)
  const { data: slides = [] } = useSlides(courseId)
  const [activeTab, setActiveTab] = useState('explanation')
  const navigate = useNavigate()

  const course = courses?.find((c) => c.id === courseId)
  const displayCourseName = course ? (language === 'ar' ? course.name_ar : course.name) : '…'
  const currentIndex = slides.findIndex((s) => s.id === slideId)
  const prevSlide = currentIndex > 0 ? slides[currentIndex - 1] : null
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' && prevSlide) navigate(`/course/${courseId}/slide/${prevSlide.id}`)
      if (e.key === 'ArrowRight' && nextSlide) navigate(`/course/${courseId}/slide/${nextSlide.id}`)
      if (e.key === 'e' || e.key === 'E') setActiveTab('explanation')
      if (e.key === 'q' || e.key === 'Q') setActiveTab('qa')
      if (e.key === 't' || e.key === 'T') setActiveTab('quiz')
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
      <div className="text-center py-24 text-muted-foreground">
        Slide not found.{' '}
        <Link to={`/course/${courseId}`} className="text-primary hover:underline">Back to course</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 32px)' }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3 shrink-0 flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">{t('dashboard')}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <Link to={`/course/${courseId}`} className="hover:text-primary transition-colors">{displayCourseName}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <span className="text-foreground font-medium">Slide {slide.slide_number}</span>
      </nav>

      {/* 3-column layout */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* Col 1: Slide list — hidden on mobile */}
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

        {/* Col 2: Slide content */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-border rounded-xl p-5 flex-1 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Slide {slide.slide_number} of {slides.length}
                </span>
                {slide.file_name && (
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">{slide.file_name}</span>
                )}
              </div>
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                {slide.original_text
                  ? <ReactMarkdown>{slide.original_text}</ReactMarkdown>
                  : <p className="text-muted-foreground italic">No text content for this slide.</p>
                }
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
              <span className="hidden sm:inline">Previous</span>
            </motion.button>

            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1} / {slides.length}
            </span>

            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!nextSlide}
              onClick={() => nextSlide && navigate(`/course/${courseId}/slide/${nextSlide.id}`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-border rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={15} />
            </motion.button>
          </div>
        </div>

        {/* Col 3: AI panel */}
        <div className="flex flex-col w-72 xl:w-88 shrink-0 bg-white border border-border rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0 relative">
            {TABS.map(({ key, labelKey, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative',
                  activeTab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={13} />
                {t(labelKey)}
                {activeTab === key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === 'explanation' && <ExplanationDisplay slide={slide} />}
                {activeTab === 'qa' && <QuestionThread slide={slide} />}
                {activeTab === 'quiz' && <QuizPanel slide={slide} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}
