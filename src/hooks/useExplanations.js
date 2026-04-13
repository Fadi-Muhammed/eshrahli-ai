import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export function useExplanation(slideId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['explanation', slideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explanations')
        .select('*')
        .eq('slide_id', slideId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user && !!slideId,
  })
}

export function useAllExplanations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['explanations', 'all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explanations')
        .select('*, slides(slide_number, course_id), courses(name, name_ar)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useUpsertExplanation() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slideId, courseId, arabicExplanation, glossary }) => {
      const { data, error } = await supabase
        .from('explanations')
        .upsert(
          {
            slide_id: slideId,
            course_id: courseId,
            arabic_explanation: arabicExplanation,
            glossary: glossary ?? {},
            user_id: user.id,
          },
          { onConflict: 'slide_id,user_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['explanation', vars.slideId] })
      qc.invalidateQueries({ queryKey: ['explanations', 'all'] })
    },
  })
}
