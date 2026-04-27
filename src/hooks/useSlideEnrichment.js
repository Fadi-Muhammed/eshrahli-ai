// Runs once per slide: renders it to an image, sends to Gemma vision,
// saves the extracted text as ai_extracted_text in the DB.
// Skips silently if the slide is already enriched.

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { renderSlideToImage } from '../lib/renderSlideToImage'
import { extractSlideInfo } from '../api/ai'

export function useSlideEnrichment(slide) {
  const queryClient = useQueryClient()
  const [isEnriching, setIsEnriching] = useState(false)

  useEffect(() => {
    // Skip if no slide, no PDF URL, already enriched, or enrichment failed
    if (!slide?.id || !slide?.file_url) return
    if (slide?.ai_extracted_text || slide?.enrichment_status === 'failed') return

    let cancelled = false

    async function enrich() {
      setIsEnriching(true)
      try {
        // Mark as in-progress
        await supabase
          .from('slides')
          .update({ enrichment_status: 'in_progress' })
          .eq('id', slide.id)

        const imageDataUrl = await renderSlideToImage(slide.file_url, slide.slide_number)
        if (cancelled) return

        const extractedText = await extractSlideInfo(imageDataUrl)
        if (cancelled) return

        // Only update if we got meaningful content
        if (extractedText && extractedText.trim().length > 0) {
          await supabase
            .from('slides')
            .update({
              ai_extracted_text: extractedText,
              enrichment_status: 'completed'
            })
            .eq('id', slide.id)

          // Refresh the slide so downstream components pick up the new text
          queryClient.invalidateQueries({ queryKey: ['slide', slide.id] })
        } else {
          // Extraction returned empty, mark as failed
          console.warn('[Enrichment] Extraction returned empty text for slide', slide.id)
          await supabase
            .from('slides')
            .update({ enrichment_status: 'failed' })
            .eq('id', slide.id)
        }
      } catch (err) {
        // Mark enrichment as failed so we don't retry repeatedly
        console.warn('[Enrichment] Failed for slide', slide.id, err?.message)
        try {
          await supabase
            .from('slides')
            .update({ enrichment_status: 'failed' })
            .eq('id', slide.id)
        } catch (updateErr) {
          console.warn('[Enrichment] Failed to update status for slide', slide.id, updateErr?.message)
        }
      } finally {
        if (!cancelled) setIsEnriching(false)
      }
    }

    enrich()
    return () => { cancelled = true }
  }, [slide?.id]) // re-run only when the slide changes, not on every render

  return { isEnriching }
}
