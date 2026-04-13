import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import RenameCourseDialog from './RenameCourseDialog'
import DeleteCourseDialog from './DeleteCourseDialog'

const COURSE_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-cyan-500',
]

function getCourseColor(id) {
  const num = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COURSE_COLORS[num % COURSE_COLORS.length]
}

export default function CourseCard({ course, slideCount = 0 }) {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const displayName = language === 'ar' ? course.name_ar : course.name
  const subName = language === 'ar' ? course.name : course.name_ar
  const color = getCourseColor(course.id)

  return (
    <>
      <div
        className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => navigate(`/course/${course.id}`)}
      >
        {/* Color strip */}
        <div className={`h-2 ${color}`} />

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{subName}</p>
            </div>

            {/* Three-dot menu */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
                className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Course options"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute end-0 z-20 mt-1 w-36 bg-white border border-border rounded-md shadow-lg py-1">
                    <button
                      className="w-full text-start px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true) }}
                    >
                      <Pencil size={14} />
                      {t('rename')}
                    </button>
                    <button
                      className="w-full text-start px-3 py-2 text-sm hover:bg-red-50 text-destructive flex items-center gap-2"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setDeleting(true) }}
                    >
                      <Trash2 size={14} />
                      {t('delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="bg-secondary px-2 py-0.5 rounded-full">
              {slideCount} {t('slides')}
            </span>
          </div>
        </div>
      </div>

      {renaming && <RenameCourseDialog course={course} onClose={() => setRenaming(false)} />}
      {deleting && <DeleteCourseDialog course={course} onClose={() => setDeleting(false)} />}
    </>
  )
}
