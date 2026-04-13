import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export function useQuiz(slideId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['quiz', slideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slide_id', slideId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user && !!slideId,
  })
}

export function useUpsertQuiz() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slideId, questions }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .upsert(
          { slide_id: slideId, questions, user_id: user.id },
          { onConflict: 'slide_id,user_id' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['quiz', vars.slideId] }),
  })
}
