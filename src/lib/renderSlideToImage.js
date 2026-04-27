// Renders a single page of a remote PDF to a base64 JPEG using pdfjs-dist.
// Used by useSlideEnrichment to feed slide images to the vision AI.

import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

export async function renderSlideToImage(pdfUrl, pageNumber, scale = 2.0) {
  const pdf = await pdfjsLib.getDocument({ url: pdfUrl, verbosity: 0 }).promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context for slide rendering')

  await page.render({ canvasContext: ctx, viewport }).promise

  // Higher quality JPEG (0.92 instead of 0.82) to reduce compression artifacts
  // and improve text readability for vision AI extraction
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

  // Free memory
  canvas.width = 0
  canvas.height = 0

  return dataUrl
}
