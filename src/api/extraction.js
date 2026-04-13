import JSZip from 'jszip'
import { supabase } from './supabaseClient'
import { convertPptxFileToPdfFile } from '../lib/pptxToPdf'

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
  const lowerName = file.name.toLowerCase()
  const isPPTX =
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    lowerName.endsWith('.pptx')

  if (!isPPTX) throw new Error('Only PPTX files are supported.')

  onProgress?.({ step: 'extracting', percent: 10 })
  const pages = await extractPPTX(file)

  if (pages.length === 0) throw new Error('No pages found in the file.')

  onProgress?.({ step: 'converting', percent: 35 })
  const pdfFile = await convertPptxFileToPdfFile(file)

  onProgress?.({ step: 'uploading', percent: 60 })
  const { url } = await uploadFile(pdfFile, userId)

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

  onProgress?.({ step: 'done', percent: 100 })
  return data
}
