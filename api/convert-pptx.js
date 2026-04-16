// ─── Vercel Serverless — Zamzar proxy (3 fast actions, no polling on server) ─
// The browser calls each endpoint separately so no single function exceeds the
// Vercel Hobby timeout of 60s:
//
//   POST /api/convert-pptx                  → submit job, returns { jobId }
//   GET  /api/convert-pptx?jobId=<id>       → check status, returns { status, fileId? }
//   GET  /api/convert-pptx?fileId=<id>      → stream PDF bytes

export const config = { runtime: 'nodejs' }

const ZAMZAR_API_KEY =
  process.env.ZAMZAR_API_KEY ||
  process.env.VITE_ZAMZAR_API_KEY ||
  'fa06f66ce315812ab2ea2010be5a5466f18df05a'
const ZAMZAR_BASE = 'https://api.zamzar.com/v1'

function zamzarAuth() {
  return 'Basic ' + Buffer.from(ZAMZAR_API_KEY + ':').toString('base64')
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── POST: submit conversion job ──────────────────────────────────────────────
async function handleSubmit(request) {
  let formData
  try {
    formData = await request.formData()
  } catch {
    return json({ error: 'Invalid multipart form data' }, 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) return json({ error: 'file field is required' }, 400)

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
    return json(
      { error: body?.errors?.[0]?.message || `Zamzar submit failed (${res.status})` },
      res.status
    )
  }

  const job = await res.json()
  return json({ jobId: job.id, status: job.status })
}

// ─── GET ?jobId=X: check status ───────────────────────────────────────────────
async function handleStatus(jobId) {
  const res = await fetch(`${ZAMZAR_BASE}/jobs/${jobId}`, {
    headers: { Authorization: zamzarAuth() },
  })

  if (!res.ok) {
    return json({ error: `Zamzar status check failed (${res.status})` }, res.status)
  }

  const job = await res.json()

  if (job.status === 'successful') {
    const fileId = job.target_files?.[0]?.id
    if (!fileId) return json({ error: 'No output file returned' }, 500)
    return json({ status: 'successful', fileId })
  }

  if (job.status === 'failed') {
    const detail = job.errors?.length ? job.errors[0].message : 'conversion failed'
    return json({ status: 'failed', error: detail })
  }

  return json({ status: job.status ?? 'pending' })
}

// ─── GET ?fileId=X: stream PDF ────────────────────────────────────────────────
async function handleDownload(fileId) {
  const res = await fetch(`${ZAMZAR_BASE}/files/${fileId}/content`, {
    headers: { Authorization: zamzarAuth() },
  })

  if (!res.ok) {
    return json({ error: `Zamzar download failed (${res.status})` }, res.status)
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-store',
    },
  })
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default async function handler(request) {
  try {
    const url = new URL(request.url)
    const jobId = url.searchParams.get('jobId')
    const fileId = url.searchParams.get('fileId')

    if (request.method === 'POST') return handleSubmit(request)
    if (request.method === 'GET' && jobId) return handleStatus(jobId)
    if (request.method === 'GET' && fileId) return handleDownload(fileId)

    return json({ error: 'Invalid request. Use POST to submit, GET ?jobId=X for status, GET ?fileId=X for download.' }, 400)
  } catch (err) {
    return json({ error: err?.message || 'Internal error' }, 500)
  }
}
