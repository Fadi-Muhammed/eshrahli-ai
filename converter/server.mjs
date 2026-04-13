import express from 'express'
import multer from 'multer'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { access, mkdir, readFile, rm } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

const execFileAsync = promisify(execFile)
const app = express()

const PORT = Number(process.env.PORT || 8787)
const HOST = '0.0.0.0'
const SOFFICE_BIN = process.env.LIBREOFFICE_BIN || 'soffice'
const UPLOAD_DIR = '/tmp/uploads'
const OUTPUT_DIR = '/tmp/outputs'
const MAX_FILE_BYTES = 50 * 1024 * 1024
const CONVERT_TIMEOUT_MS = 120000
const ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream',
])

app.disable('x-powered-by')
app.use(express.json({ limit: '256kb' }))
app.use(express.urlencoded({ extended: false, limit: '256kb' }))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const requestId = randomUUID()
    cb(null, `${requestId}${extname(file.originalname || '.pptx').toLowerCase()}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
})

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function isAllowedPptx(file) {
  const extensionOk = extname(file.originalname || '').toLowerCase() === '.pptx'
  const mimeOk = ALLOWED_MIME_TYPES.has((file.mimetype || '').toLowerCase())
  return extensionOk && mimeOk
}

async function ensureRuntimeDirs() {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await mkdir(OUTPUT_DIR, { recursive: true })
}

async function ensureSofficeAvailable() {
  await access(SOFFICE_BIN, fsConstants.X_OK).catch(async () => {
    const result = await execFileAsync(SOFFICE_BIN, ['--version'], {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    })
    return result
  })

  const { stdout, stderr } = await execFileAsync(SOFFICE_BIN, ['--version'], {
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  })
  const version = String(stdout || stderr || '').trim()
  console.info('[converter] LibreOffice ready', {
    soffice: SOFFICE_BIN,
    version,
  })
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/convert', upload.single('file'), async (req, res) => {
  const startedAt = Date.now()
  const requestId = randomUUID()
  let generatedDefaultPath

  try {
    if (!req.file) {
      res.status(400).json({ error: 'field "file" is required' })
      return
    }

    if (!isAllowedPptx(req.file)) {
      res.status(400).json({
        error: 'only .pptx files are supported',
      })
      return
    }

    const originalBase = basename(req.file.originalname, '.pptx') || 'presentation'
    const safeBase = sanitizeFilename(originalBase)

    console.info('[converter] conversion started', {
      requestId,
      originalName: req.file.originalname,
      uploadPath: req.file.path,
      size: req.file.size,
    })

    const result = await execFileAsync(
      SOFFICE_BIN,
      [
        '--headless',
        '--nologo',
        '--nodefault',
        '--nofirststartwizard',
        '--convert-to',
        'pdf',
        '--outdir',
        OUTPUT_DIR,
        req.file.path,
      ],
      { timeout: CONVERT_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }
    )

    generatedDefaultPath = join(
      OUTPUT_DIR,
      `${basename(req.file.path, extname(req.file.path))}.pdf`
    )

    const pdfBytes = await readFile(generatedDefaultPath)
    const downloadName = `${safeBase}.pdf`

    console.info('[converter] conversion finished', {
      requestId,
      durationMs: Date.now() - startedAt,
      stdout: (result.stdout || '').slice(0, 500),
      stderr: (result.stderr || '').slice(0, 500),
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(pdfBytes)
  } catch (error) {
    console.error('[converter] conversion failed', {
      requestId,
      durationMs: Date.now() - startedAt,
      message: error?.message,
      code: error?.code,
      stderr: String(error?.stderr || '').slice(0, 1000),
      stdout: String(error?.stdout || '').slice(0, 1000),
    })
    res.status(500).json({ error: 'failed to convert PPTX to PDF' })
  } finally {
    if (req.file?.path) {
      await rm(req.file.path, { force: true }).catch(() => {})
    }
    if (generatedDefaultPath) {
      await rm(generatedDefaultPath, { force: true }).catch(() => {})
    }
  }
})

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: `file too large (max ${MAX_FILE_BYTES} bytes)` })
      return
    }
    res.status(400).json({ error: err.message })
    return
  }

  console.error('[converter] unhandled error', {
    message: err?.message,
  })
  res.status(500).json({ error: 'internal server error' })
})

await ensureRuntimeDirs()
await ensureSofficeAvailable()

app.listen(PORT, HOST, () => {
  console.info(`[converter] listening on http://${HOST}:${PORT}`)
})
