import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSlides, useSlide } from '../hooks/useSlides'
import { useCourses } from '../hooks/useCourses'
import { useLanguage } from '../components/LanguageContext'
import ExplanationDisplay from '../components/slide/ExplanationDisplay'
import QuestionThread from '../components/slide/QuestionThread'
import QuizPanel from '../components/slide/QuizPanel'
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const TABS = [
  { key: 'explanation', labelKey: 'explanation' },
  { key: 'qa', labelKey: 'questions' },
  { key: 'quiz', labelKey: 'quiz' },
]

function SlideNavItem({ slide, isActive, courseId }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/course/${courseId}/slide/${slide.id}`)}
      className={cn(
        'w-full text-start px-3 py-2.5 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-semibold border-s-2 border-primary'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
    >
      <span className="font-medium">Slide {slide.slide_number}</span>
      {slide.original_text && (
        <p className="text-xs truncate mt-0.5 opacity-70">
          {slide.original_text.slice(0, 40)}
        </p>
      )}
    </button>
  )
}

export default function Slide() {
  const { courseId, slideId } = useParams()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slide, isLoading: slideLoading } = useSlide(slideId)
  const { data: slides = [] } = useSlides(courseId)
  const [activeTab, setActiveTab] = useState('explanation')

  const course = courses?.find((c) => c.id === courseId)
  const displayCourseName = course ? (language === 'ar' ? course.name_ar : course.name) : '...'

  const currentIndex = slides.findIndex((s) => s.id === slideId)
  const prevSlide = currentIndex > 0 ? slides[currentIndex - 1] : null
  const nextSlide = currentIndex < slides.length - 1 ? slides[currentIndex + 1] : null

  const navigate = useNavigate()

  if (slideLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!slide) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Slide not found.{' '}
        <Link to={`/course/${courseId}`} className="text-primary hover:underline">
          Back to course
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3 shrink-0">
        <Link to="/" className="hover:text-primary">{t('dashboard')}</Link>
        <ChevronRight size={14} />
        <Link to={`/course/${courseId}`} className="hover:text-primary">{displayCourseName}</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">Slide {slide.slide_number}</span>
      </nav>

      {/* 3-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Col 1: Slide navigation list */}
        <div className="hidden lg:flex flex-col w-48 shrink-0 bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('slides')} ({slides.length})
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {slides.map((s) => (
              <SlideNavItem
                key={s.id}
                slide={s}
                isActive={s.id === slideId}
                courseId={courseId}
              />
            ))}
          </div>
        </div>

        {/* Col 2: Slide content */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <div className="bg-white border border-border rounded-lg p-5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Slide {slide.slide_number}
              </span>
              {slide.file_name && (
                <span className="text-xs text-muted-foreground">{slide.file_name}</span>
              )}
            </div>
            <div className="prose prose-sm max-w-none">
              {slide.original_text
                ? <ReactMarkdown>{slide.original_text}</ReactMarkdown>
                : <p className="text-muted-foreground italic">No text content for this slide.</p>
              }
            </div>
          </div>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between shrink-0">
            <button
              disabled={!prevSlide}
              onClick={() => prevSlide && navigate(`/course/${courseId}/slide/${prevSlide.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              disabled={!nextSlide}
              onClick={() => nextSlide && navigate(`/course/${courseId}/slide/${nextSlide.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Col 3: AI panel */}
        <div className="flex flex-col w-80 xl:w-96 shrink-0 bg-white border border-border rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'explanation' && <ExplanationDisplay slide={slide} />}
            {activeTab === 'qa' && <QuestionThread slide={slide} />}
            {activeTab === 'quiz' && <QuizPanel slide={slide} />}
          </div>
        </div>

      </div>
    </div>
  )
}
