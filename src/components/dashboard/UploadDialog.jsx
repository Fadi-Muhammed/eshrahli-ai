import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useCourses } from '../../hooks/useCourses'
import { useAuth } from '../../lib/AuthContext'
import { useLanguage } from '../LanguageContext'
import { extractAndCreateSlides } from '../../api/extraction'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, CheckCircle, X, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

function toErrorDetails(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    }
  }
  return {
    message: String(error),
    raw: error,
  }
}

export default function UploadDialog({ onClose, defaultCourseId = '' }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { data: courses = [] } = useCourses()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [courseId, setCourseId] = useState(defaultCourseId)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState('select') // select | uploading | done
  const [progress, setProgress] = useState({ step: '', percent: 0 })
  const [result, setResult] = useState(null) // { count, courseId }
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const clearSelectedFile = useCallback(() => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }, [])

  const handleFile = useCallback((f) => {
    if (!f) return
    const lowerName = f.name.toLowerCase()
    const ok = lowerName.endsWith('.pptx') || lowerName.endsWith('.pdf')
    if (!ok) { toast.error('Only PPTX or PDF files are supported.'); return }
    if (f.size > 52_428_800) { toast.error('File must be under 50 MB.'); return }
    setFile(f)
    setError(null)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleUpload = async () => {
    if (!file || !courseId) return
    setStep('uploading')
    setError(null)
    try {
      const slides = await extractAndCreateSlides({
        file,
        courseId,
        userId: user.id,
        onProgress: setProgress,
      })
      qc.invalidateQueries({ queryKey: ['slides', courseId] })
      setResult({ count: slides.length, courseId })
      setStep('done')
    } catch (err) {
      const errorDetails = toErrorDetails(err)
      console.error('[UploadDialog] Upload/extraction failed', {
        courseId,
        fileName: file?.name,
        error: errorDetails,
      })
      setError(errorDetails.message || 'Upload failed')
      setStep('select')
    }
  }

  const progressLabel = {
    extracting: 'Extracting pages…',
    converting: 'Converting PPTX to PDF…',
    scanning: progress.total
      ? `Scanning slides with AI… (${progress.scanned}/${progress.total})`
      : 'Scanning slides with AI…',
    uploading: 'Uploading file…',
    saving: 'Saving slides…',
    done: 'Done!',
  }[progress.step] ?? 'Processing…'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="bg-card rounded-xl shadow-2xl dark:shadow-black/45 w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Upload Slides</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* ── Step: select ── */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4"
              >
                {/* Course picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Course</label>
                  <div className="relative">
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full appearance-none border border-input rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-background pr-9"
                    >
                      <option value="">Select a course…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={openFilePicker}
                  className={cn(
                    'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                    dragging
                      ? 'border-primary bg-primary/5 scale-[1.01]'
                      : file
                        ? 'border-green-500/70 bg-green-500/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pptx,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFile(e.target.files[0])
                      e.target.value = ''
                    }}
                  />

                  <AnimatePresence mode="wait">
                    {file ? (
                      <motion.div key="file" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
                        <CheckCircle size={32} className="text-green-500" />
                        <p className="font-medium text-sm text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearSelectedFile()
                          }}
                          className="text-xs text-muted-foreground hover:text-destructive mt-1"
                        >
                          Remove
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload size={22} className="text-primary" />
                        </div>
                        <p className="font-medium text-sm text-foreground">Drop your file here</p>
                        <p className="text-xs text-muted-foreground">PPTX preferred · PDF fallback · max 50 MB</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {error && (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">{error}</p>
                    {String(error).includes('cannot be converted reliably in the browser engine') && (
                      <p className="text-xs text-muted-foreground rounded-lg border border-border px-3 py-2 bg-muted/40">
                        Tip: run the backend converter and set <code>VITE_PPTX_CONVERTER_URL</code> to bypass browser conversion limits.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={!file || !courseId}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || !courseId}
                    className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
                  >
                    <Upload size={14} />
                    Upload & Extract
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step: uploading ── */}
            {step === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center gap-6 py-4"
              >
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress.percent / 100)}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
                    {progress.percent}%
                  </span>
                </div>

                <div className="text-center">
                  <p className="font-medium text-foreground">{progressLabel}</p>
                  <p className="text-sm text-muted-foreground mt-1">{file?.name}</p>
                </div>

                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </motion.div>
            )}

            {/* ── Step: done ── */}
            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-green-500/12 flex items-center justify-center"
                >
                  <CheckCircle size={32} className="text-green-500" />
                </motion.div>
                <div>
                  <p className="font-semibold text-foreground text-lg">All done!</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Extracted <span className="font-semibold text-foreground">{result?.count}</span> slides from <span className="font-medium">{file?.name}</span>
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
                    Close
                  </button>
                  <button
                    onClick={() => { onClose(); navigate(`/course/${result?.courseId}`) }}
                    className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all font-medium"
                  >
                    View Course →
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
