// ─── Eshrahli AI — PPTX → PDF Converter (Zamzar) ────────────────────────────
// Express server that receives a PPTX upload, converts it via the Zamzar API,
// and returns the resulting PDF bytes.  No LibreOffice required.

import express from 'express'
import multer from 'multer'
import { mkdir, rm } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const PORT = Number(process.env.PORT || 8787)
const HOST = '0.0.0.0'
const UPLOAD_DIR = '/tmp/uploads'
const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

// ─── Zamzar config ────────────────────────────────────────────────────────────
const ZAMZAR_API_KEY =
  process.env.ZAMZAR_API_KEY ||
  process.env.VITE_ZAMZAR_API_KEY ||
  'fa06f66ce315812ab2ea2010be5a5466f18df05a'
const ZAMZAR_BASE = 'https://api.zamzar.com/v1'

function zamzarAuth() {
  // Basic auth: API key as username, empty password
  return 'Basic ' + Buffer.from(ZAMZAR_API_KEY + ':').toString('base64')
}

async function zamzarSubmitJob(filePath, originalName) {
  const fileBuffer = await readFile(filePath)
  const blob = new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })

  const form = new FormData()
  form.append('source_file', blob, originalName)
  form.append('target_format', 'pdf')

  const res = await fetch(`${ZAMZAR_BASE}/jobs`, {
    method: 'POST',
    headers: { Authorization: zamzarAuth() },
    body: form,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg =
      body?.errors?.[0]?.message ||
      body?.message ||
      `Zamzar job creation failed (${res.status})`
    throw new Error(msg)
  }

  return res.json() // { id, status, ... }
}

async function zamzarPollJob(jobId, maxWaitMs = 120_000, intervalMs = 3_000) {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs))

    const res = await fetch(`${ZAMZAR_BASE}/jobs/${jobId}`, {
      headers: { Authorization: zamzarAuth() },
    })
    if (!res.ok) throw new Error(`Zamzar status check failed (${res.status})`)

    const job = await res.json()
    console.info('[zamzar] job status', { jobId, status: job.status })

    if (job.status === 'successful') return job
    if (job.status === 'failed') {
      const detail = job.errors?.length ? ': ' + job.errors[0].message : ''
      throw new Error(`Zamzar conversion failed${detail}`)
    }
  }

  throw new Error('Zamzar conversion timed out after 2 minutes')
}

async function zamzarDownload(fileId) {
  const res = await fetch(`${ZAMZAR_BASE}/files/${fileId}/content`, {
    headers: { Authorization: zamzarAuth() },
  })
  if (!res.ok) throw new Error(`Zamzar download failed (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

// ─── Express setup ────────────────────────────────────────────────────────────
const app = express()
app.disable('x-powered-by')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname || '.pptx').toLowerCase()}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
})

app.get('/health', (_req, res) => res.json({ ok: true, engine: 'zamzar' }))

app.post('/convert', upload.single('file'), async (req, res) => {
  const startedAt = Date.now()

  if (!req.file) {
    res.status(400).json({ error: 'field "file" is required' })
    return
  }

  const extOk = extname(req.file.originalname || '').toLowerCase() === '.pptx'
  if (!extOk) {
    await rm(req.file.path, { force: true }).catch(() => {})
    res.status(400).json({ error: 'only .pptx files are supported' })
    return
  }

  console.info('[converter] conversion started', {
    file: req.file.originalname,
    size: req.file.size,
  })

  try {
    // 1 — submit job to Zamzar
    const job = await zamzarSubmitJob(req.file.path, req.file.originalname)
    console.info('[converter] Zamzar job submitted', { jobId: job.id })

    // 2 — wait for completion
    const completedJob = await zamzarPollJob(job.id)

    // 3 — download the PDF
    const fileId = completedJob.target_files?.[0]?.id
    if (!fileId) throw new Error('Zamzar succeeded but returned no output file')

    const pdfBuffer = await zamzarDownload(fileId)
    if (!pdfBuffer || pdfBuffer.length === 0) throw new Error('Zamzar returned an empty PDF')

    const baseName = req.file.originalname.replace(/\.pptx$/i, '') || 'presentation'
    console.info('[converter] conversion done', {
      durationMs: Date.now() - startedAt,
      outputBytes: pdfBuffer.length,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(pdfBuffer)
  } catch (err) {
    console.error('[converter] conversion failed', {
      durationMs: Date.now() - startedAt,
      message: err?.message,
    })
    res.status(500).json({ error: err?.message || 'Failed to convert PPTX to PDF' })
  } finally {
    if (req.file?.path) await rm(req.file.path, { force: true }).catch(() => {})
  }
})

app.use((err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` })
    return
  }
  console.error('[converter] unhandled error', err?.message)
  res.status(500).json({ error: 'Internal server error' })
})

await mkdir(UPLOAD_DIR, { recursive: true })

app.listen(PORT, HOST, () => {
  console.info(`[converter] Zamzar-powered converter ready on http://${HOST}:${PORT}`)
})
