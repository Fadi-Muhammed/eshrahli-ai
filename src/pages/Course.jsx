import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCourses } from '../hooks/useCourses'
import { useSlides, useRenameLecture } from '../hooks/useSlides'
import { useLanguage } from '../components/LanguageContext'
import { FileText, ChevronRight, Upload, ChevronDown, FileStack, Star, Pencil, Check, X } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import UploadDialog from '../components/dashboard/UploadDialog'
import SlideStatusPills from '../components/slide/SlideStatusPills'
import { useFavorites } from '../hooks/useFavorites'
import { toast } from 'sonner'

function SkeletonSlide() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="h-5 bg-muted rounded-md w-52 mb-3" />
      <div className="h-3 bg-muted rounded w-28 mb-4" />
      <div className="h-9 bg-muted rounded-lg w-full" />
    </div>
  )
}

function lectureKey(slide) {
  return slide.file_url || slide.file_name || `slide-${slide.id}`
}

function getLectureGroups(slides = []) {
  const groups = []
  const map = new Map()

  slides.forEach((slide) => {
    const key = lectureKey(slide)
    if (!map.has(key)) {
      const group = { key, fileName: slide.file_name || 'Untitled Lecture', slides: [] }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key).slides.push(slide)
  })

  return groups
}

function LectureCard({ group, courseId, index, isHovered, onHoverStart, onHoverEnd, onRenameLecture, renamePending }) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isRenaming, setIsRenaming] = useState(false)
  const [nextName, setNextName] = useState(group.fileName)
  const previewSlides = group.slides.slice(0, 5)
  const hiddenSlidesCount = Math.max(group.slides.length - previewSlides.length, 0)

  useEffect(() => {
    setNextName(group.fileName)
  }, [group.fileName])

  const handleRename = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = nextName.trim()
    if (!trimmed) return
    await onRenameLecture(group, trimmed)
    setIsRenaming(false)
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="h-fit rounded-xl border border-border bg-card overflow-hidden"
      style={{ boxShadow: isHovered ? '0 12px 24px rgba(20,40,80,0.1)' : '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="w-full px-3.5 py-3 text-start flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <FileStack size={16} className="text-primary shrink-0 mt-0.5" />
            {isRenaming ? (
              <form onSubmit={handleRename} className="flex items-center gap-1.5 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  value={nextName}
                  onChange={(e) => setNextName(e.target.value)}
                  className="h-7 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={renamePending}
                  className="h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-60"
                  aria-label="Save lecture name"
                >
                  <Check size={13} className="mx-auto" />
                </button>
                <button
                  type="button"
                  disabled={renamePending}
                  onClick={(e) => {
                    e.stopPropagation()
                    setNextName(group.fileName)
                    setIsRenaming(false)
                  }}
                  className="h-7 w-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-60"
                  aria-label="Cancel lecture rename"
                >
                  <X size={13} className="mx-auto" />
                </button>
              </form>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/course/${courseId}/lecture/${encodeURIComponent(group.key)}`)}
                  className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {group.fileName}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setNextName(group.fileName)
                    setIsRenaming(true)
                  }}
                  className="h-6 w-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                  aria-label="Rename lecture"
                >
                  <Pencil size={13} className="mx-auto" />
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{group.slides.length} {group.slides.length === 1 ? 'slide' : 'slides'}</p>
        </div>
        <button
          onClick={() => navigate(`/course/${courseId}/lecture/${encodeURIComponent(group.key)}`)}
          className="shrink-0"
          aria-label="Open lecture"
        >
          <motion.div animate={{ rotate: isHovered ? 180 : 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <ChevronDown size={16} className="text-muted-foreground" />
          </motion.div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isHovered && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-2 bg-secondary/30">
              <div className="max-h-52 overflow-y-auto flex flex-col gap-1.5 pe-1">
              {previewSlides.map((slide) => {
                const starred = isFavorite(slide.id)
                return (
                  <div
                    key={slide.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/course/${courseId}/slide/${slide.id}`)
                    }}
                    className="w-full rounded-lg border border-border/70 bg-card px-2.5 py-1.5 text-start hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-primary">Slide {slide.slide_number}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(slide.id)
                        }}
                        className={starred ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}
                        aria-label={starred ? 'Remove favorite' : 'Add favorite'}
                      >
                        <Star size={14} fill={starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{slide.original_text || 'No text content'}</p>
                    <SlideStatusPills slideId={slide.id} isFavorite={starred} />
                  </div>
                )
              })}
                {hiddenSlidesCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/course/${courseId}/lecture/${encodeURIComponent(group.key)}`)
                    }}
                    className="w-full rounded-lg border border-dashed border-border bg-card/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground text-start hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    +{hiddenSlidesCount} more slides
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export default function Course() {
  const { courseId } = useParams()
  const { t, language } = useLanguage()
  const { data: courses } = useCourses()
  const { data: slides, isLoading, error } = useSlides(courseId)
  const renameLecture = useRenameLecture()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [hoveredLectureKey, setHoveredLectureKey] = useState(null)

  const course = courses?.find((c) => c.id === courseId)
  const displayName = course ? (language === 'ar' ? course.name_ar : course.name) : '…'
  const lectureGroups = useMemo(() => getLectureGroups(slides ?? []), [slides])

  const handleRenameLecture = async (group, name) => {
    if (!courseId || name === group.fileName) return
    try {
      await renameLecture.mutateAsync({
        courseId,
        slideIds: group.slides.map((slide) => slide.id),
        name,
      })
      toast.success('Lecture renamed')
    } catch (err) {
      toast.error(err.message ?? 'Failed to rename lecture')
      throw err
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-primary/80 mb-4 flex-wrap">
        <Link to="/" className="text-primary hover:opacity-85 transition-opacity">{t('dashboard')}</Link>
        <ChevronRight size={13} className="opacity-40" />
        <span className="text-primary font-medium">{displayName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">{displayName}</h1>
          <p className="text-primary/80 text-sm mt-0.5">
            {isLoading ? '…' : `${slides?.length ?? 0} ${t('slides')}`}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <Upload size={15} />
          {t('upload')}
        </motion.button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 text-sm mb-4">
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
          <h2 className="text-lg font-semibold text-primary mb-2">{t('noSlidesYet')}</h2>
          <p className="text-primary/80 text-sm mb-6">{t('uploadSlides')}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Upload size={15} />
            Upload PPTX/PDF
          </motion.button>
        </motion.div>
      )}

      {!isLoading && !error && slides?.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {lectureGroups.map((group, i) => (
            <LectureCard
              key={group.key}
              group={group}
              courseId={courseId}
              index={i}
              isHovered={hoveredLectureKey === group.key}
              onHoverStart={() => setHoveredLectureKey(group.key)}
              onHoverEnd={() => setHoveredLectureKey((current) => (current === group.key ? null : current))}
              onRenameLecture={handleRenameLecture}
              renamePending={renameLecture.isPending}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} defaultCourseId={courseId} />}
      </AnimatePresence>
    </div>
  )
}
