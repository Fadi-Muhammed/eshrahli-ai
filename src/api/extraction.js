import JSZip from 'jszip'
import { supabase } from './supabaseClient'
import { convertPptxFileToPdfFile } from '../lib/pptxToPdf'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

async function extractPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ').trim()
    pages.push(text)
  }
  return pages
}

// ─── PPTX ────────────────────────────────────────────────────────────────────
async function extractPPTX(file) {
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Get slide XML files in order
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const n = (s) => parseInt(s.match(/(\d+)\.xml$/)[1])
      return n(a) - n(b)
    })

  const pages = []
  for (const entry of slideEntries) {
    const xml = await zip.files[entry].async('string')
    // Extract all <a:t> text nodes (DrawingML text runs)
    const matches = [...xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/gs)]
    const text = matches
      .map((m) => m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    pages.push(text)
  }
  return pages
}

// ─── Upload file to Supabase Storage ─────────────────────────────────────────
async function uploadFile(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('slides').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('slides').getPublicUrl(path)
  return { path, url: data.publicUrl }
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function extractAndCreateSlides({
  file,
  courseId,
  userId,
  onProgress,
}) {
  console.info('[Extraction] Started', {
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size,
    courseId,
    userId,
  })

  const lowerName = file.name.toLowerCase()
  const isPDF = file.type === 'application/pdf' || lowerName.endsWith('.pdf')
  const isPPTX =
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lowerName.endsWith('.pptx')

  if (!isPPTX && !isPDF) throw new Error('Only PPTX or PDF files are supported.')

  onProgress?.({ step: 'extracting', percent: 10 })
  console.info('[Extraction] Extracting slide text', { isPPTX, isPDF })
  const pages = isPPTX ? await extractPPTX(file) : await extractPDF(file)

  if (pages.length === 0) throw new Error('No pages found in the file.')

  let uploadableFile = file
  if (isPPTX) {
    onProgress?.({ step: 'converting', percent: 35 })
    console.info('[Extraction] Converting PPTX to PDF')
    uploadableFile = await convertPptxFileToPdfFile(file)
  }

  onProgress?.({ step: 'uploading', percent: 60 })
  console.info('[Extraction] Uploading source/conversion output', {
    uploadFileName: uploadableFile?.name,
    uploadFileType: uploadableFile?.type,
    uploadFileSize: uploadableFile?.size,
  })
  const { url } = await uploadFile(uploadableFile, userId)

  onProgress?.({ step: 'saving', percent: 80 })

  // Batch insert all slides
  const rows = pages.map((text, i) => ({
    course_id: courseId,
    user_id: userId,
    slide_number: i + 1,
    original_text: text || '(no text on this slide)',
    file_name: file.name,
    file_url: url,
  }))

  const { data, error } = await supabase.from('slides').insert(rows).select()
  if (error) throw error

  console.info('[Extraction] Completed', {
    slidesInserted: data?.length,
    fileUrl: url,
  })

  onProgress?.({ step: 'done', percent: 100 })
  return data
}
