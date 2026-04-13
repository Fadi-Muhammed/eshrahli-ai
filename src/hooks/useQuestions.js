import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export function useQuestions(slideId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['questions', slideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('slide_id', slideId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user && !!slideId,
  })
}

export function useCreateQuestion() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slideId, questionText, answerText }) => {
      const { data, error } = await supabase
        .from('questions')
        .insert({ slide_id: slideId, question_text: questionText, answer_text: answerText, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['questions', vars.slideId] }),
  })
}
