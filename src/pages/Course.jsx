import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCourses } from '../hooks/useCourses'
import { useSlides } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import { useExplanation } from '../hooks/useExplanations'
import { useQuiz } from '../hooks/useQuizzes'
import { useQuestions } from '../hooks/useQuestions'
import { FileText, ChevronRight, Upload } from 'lucide-react'
import { useState } from 'react'
import UploadDialog from '../components/dashboard/UploadDialog'
import { AnimatePresence } from 'framer-motion'

function SlideBadges({ slideId }) {
  const { data: exp } = useExplanation(slideId)
  const { data: quiz } = useQuiz(slideId)
  const { data: questions } = useQuestions(slideId)
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {exp && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Explained</span>}
      {quiz && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Quiz</span>}
      {questions?.length > 0 && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{questions.length} Q&A</span>}
    </div>
  )
}

function SlideCard({ slide, courseId, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.09)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/course/${courseId}/slide/${slide.id}`)}
      className="bg-white border border-border rounded-xl p-4 cursor-pointer transition-colors hover:border-primary/30"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Slide {slide.slide_number}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {slide.original_text || 'No text content'}
      </p>
      <SlideBadges slideId={slide.id} />
    </motion.div>
  )
}

function SkeletonSlide() {
  return (
    <div className="bg-white border border-border rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-muted rounded-full w-16 mb-3" />
      <div className="h-3 bg-muted rounded w-full mb-1.5" />
      <div className="h-3 bg-muted rounded w-4/5 mb-1.5" />
      <div className="h-3 bg-muted rounded w-3/5" />
    </div>
  )
}

export default function Course() {
  const { courseId } = useParams()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slides, isLoading, error } = useSlides(courseId)
  const [uploadOpen, setUploadOpen] = useState(false)

  const course = courses?.find((c) => c.id === courseId)
  const displayName = course ? (language === 'ar' ? course.name_ar : course.name) : '…'

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
        <Link to="/" className="hover:text-primary transition-colors">{t('dashboard')}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? '…' : `${slides?.length ?? 0} ${t('slides')}`}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 border border-border bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <Upload size={15} />
          {t('upload')}
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-destructive rounded-lg p-4 text-sm mb-4">
          {error.message}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonSlide key={i} />)}
        </div>
      )}

      {!isLoading && !error && slides?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
            <FileText size={30} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">{t('noSlidesYet')}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t('uploadSlides')}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Upload size={15} />
            Upload PDF or PPTX
          </motion.button>
        </motion.div>
      )}

      {!isLoading && !error && slides?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {slides.map((slide, i) => (
            <SlideCard key={slide.id} slide={slide} courseId={courseId} index={i} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
