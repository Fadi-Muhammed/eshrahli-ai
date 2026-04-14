// ─── Vercel Serverless Function — PPTX → PDF via Zamzar ──────────────────────
export const config = { runtime: 'nodejs' }

const ZAMZAR_API_KEY =
  process.env.ZAMZAR_API_KEY ||
  process.env.VITE_ZAMZAR_API_KEY ||
  'fa06f66ce315812ab2ea2010be5a5466f18df05a'
const ZAMZAR_BASE = 'https://api.zamzar.com/v1'

function zamzarAuth() {
  return 'Basic ' + Buffer.from(ZAMZAR_API_KEY + ':').toString('base64')
}

function errorJson(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function zamzarSubmitJob(file) {
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
    const msg =
      body?.errors?.[0]?.message ||
      body?.message ||
      `Zamzar job creation failed (${res.status})`
    throw new Error(msg)
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
    if (job.status === 'successful') return job
    if (job.status === 'failed') {
      const detail = job.errors?.length ? ': ' + job.errors[0].message : ''
      throw new Error(`Zamzar conversion failed${detail}`)
    }
  }

  throw new Error('Zamzar conversion timed out')
}

async function zamzarDownload(fileId) {
  const res = await fetch(`${ZAMZAR_BASE}/files/${fileId}/content`, {
    headers: { Authorization: zamzarAuth() },
  })
  if (!res.ok) throw new Error(`Zamzar download failed (${res.status})`)
  return res.arrayBuffer()
}

export default async function handler(request) {
  if (request.method !== 'POST') return errorJson('Method not allowed', 405)

  let formData
  try {
    formData = await request.formData()
  } catch {
    return errorJson('Invalid multipart form data', 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) return errorJson('file field is required', 400)

  try {
    const job = await zamzarSubmitJob(file)
    const completedJob = await zamzarPollJob(job.id)

    const fileId = completedJob.target_files?.[0]?.id
    if (!fileId) throw new Error('Zamzar succeeded but returned no output file')

    const pdfBytes = await zamzarDownload(fileId)
    const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${baseName}.pdf"`,
      },
    })
  } catch (err) {
    return errorJson(err?.message || 'Conversion failed', 500)
  }
}
