// ─── PPTX → PDF via Zamzar ───────────────────────────────────────────────────
// Dev:  Vite proxies /zamzar-api → https://api.zamzar.com  (no CORS)
// Prod: /api/convert-pptx Vercel serverless function handles everything

const ZAMZAR_API_KEY = import.meta.env.VITE_ZAMZAR_API_KEY
// In dev the Vite proxy strips /zamzar-api and forwards to api.zamzar.com.
// In prod the browser would hit CORS, so we go through the Vercel function instead.
const IS_DEV = import.meta.env.DEV
const ZAMZAR_BASE = IS_DEV ? '/zamzar-api/v1' : null
const VERCEL_CONVERTER = '/api/convert-pptx'

function zamzarAuth() {
  return 'Basic ' + btoa(ZAMZAR_API_KEY + ':')
}

// ─── Dev path: direct Zamzar calls via Vite proxy ────────────────────────────

async function zamzarCreateJob(file) {
  const form = new FormData()
  form.append('source_file', file, file.name)
  form.append('target_format', 'pdf')

  const res = await fetch(`${ZAMZAR_BASE}/jobs`, {
    method: 'POST',
    headers: { Authorization: zamzarAuth() },
    body: form,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      body?.errors?.[0]?.message || body?.message || `Zamzar job creation failed (${res.status})`
    )
  }
  return res.json()
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
    console.info('[PPTX→PDF] Zamzar job status', { jobId, status: job.status })

    if (job.status === 'successful') return job
    if (job.status === 'failed') {
      throw new Error(`Zamzar conversion failed${job.errors?.length ? ': ' + job.errors[0].message : ''}`)
    }
  }
  throw new Error('Zamzar conversion timed out after 2 minutes')
}

async function zamzarDownload(fileId) {
  const res = await fetch(`${ZAMZAR_BASE}/files/${fileId}/content`, {
    headers: { Authorization: zamzarAuth() },
  })
  if (!res.ok) throw new Error(`Zamzar download failed (${res.status})`)
  return res.blob()
}

async function convertViaDev(file) {
  const job = await zamzarCreateJob(file)
  console.info('[PPTX→PDF] Zamzar job created', { jobId: job.id })

  const completed = await zamzarPollJob(job.id)
  const fileId = completed.target_files?.[0]?.id
  if (!fileId) throw new Error('Zamzar succeeded but returned no output file')

  const blob = await zamzarDownload(fileId)
  if (!blob || blob.size === 0) throw new Error('Zamzar returned an empty PDF')

  const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'
  return new File([blob], `${baseName}.pdf`, { type: 'application/pdf' })
}

// ─── Prod path: Vercel serverless function ────────────────────────────────────

async function convertViaProd(file) {
  const form = new FormData()
  form.append('file', file, file.name)

  const res = await fetch(VERCEL_CONVERTER, { method: 'POST', body: form })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || body?.message || `Converter error (${res.status})`)
  }

  const blob = await res.blob()
  if (!blob || blob.size === 0) throw new Error('Converter returned an empty PDF')

  const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'
  return new File([blob], `${baseName}.pdf`, { type: 'application/pdf' })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function convertPptxFileToPdfFile(file) {
  console.info('[PPTX→PDF] Starting conversion', {
    mode: IS_DEV ? 'dev (Vite proxy → Zamzar)' : 'prod (Vercel function)',
    fileName: file?.name,
    fileSize: file?.size,
  })

  const result = IS_DEV ? await convertViaDev(file) : await convertViaProd(file)
  console.info('[PPTX→PDF] Done', { outputSize: result.size })
  return result
}
