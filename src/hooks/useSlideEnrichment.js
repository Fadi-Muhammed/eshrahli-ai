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
    // Skip if no slide, no PDF URL, or already enriched
    if (!slide?.id || !slide?.file_url || slide?.ai_extracted_text) return

    let cancelled = false

    async function enrich() {
      setIsEnriching(true)
      try {
        const imageDataUrl = await renderSlideToImage(slide.file_url, slide.slide_number)
        if (cancelled) return

        const extractedText = await extractSlideInfo(imageDataUrl)
        if (cancelled || !extractedText) return

        await supabase
          .from('slides')
          .update({ ai_extracted_text: extractedText })
          .eq('id', slide.id)

        // Refresh the slide so downstream components pick up the new text
        queryClient.invalidateQueries({ queryKey: ['slide', slide.id] })
      } catch (err) {
        // Silent failure — original_text is still used as fallback
        console.warn('[Enrichment] Failed for slide', slide.id, err?.message)
      } finally {
        if (!cancelled) setIsEnriching(false)
      }
    }

    enrich()
    return () => { cancelled = true }
  }, [slide?.id]) // re-run only when the slide changes, not on every render

  return { isEnriching }
}
