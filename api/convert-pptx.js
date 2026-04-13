export const config = {
  runtime: 'nodejs',
}

function errorJson(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return errorJson('Method not allowed', 405)
  }

  const upstreamUrl = process.env.PPTX_CONVERTER_UPSTREAM_URL
  if (!upstreamUrl) {
    return errorJson('Missing PPTX_CONVERTER_UPSTREAM_URL', 500)
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return errorJson('Invalid multipart form data', 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return errorJson('file is required', 400)
  }

  const forwardForm = new FormData()
  forwardForm.append('file', file, file.name)

  let upstreamResponse
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      body: forwardForm,
    })
  } catch (error) {
    return errorJson(`Could not reach upstream converter: ${error?.message || 'network error'}`, 502)
  }

  if (!upstreamResponse.ok) {
    const bodyText = await upstreamResponse.text().catch(() => '')
    return errorJson(bodyText || `Upstream converter failed (${upstreamResponse.status})`, 502)
  }

  const pdfBytes = await upstreamResponse.arrayBuffer()
  const baseName = file.name.replace(/\.pptx$/i, '') || 'presentation'

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="${baseName}.pdf"`,
    },
  })
}
