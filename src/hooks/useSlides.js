import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export function useSlides(courseId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['slides', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('course_id', courseId)
        .order('slide_number', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user && !!courseId,
  })
}

export function useSlide(slideId) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['slide', slideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('id', slideId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user && !!slideId,
  })
}

export function useCreateSlide() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (slideData) => {
      const { data, error } = await supabase
        .from('slides')
        .insert({ ...slideData, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['slides', vars.course_id] }),
  })
}

export function useDeleteSlide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ slideId, courseId }) => {
      const { error } = await supabase.from('slides').delete().eq('id', slideId)
      if (error) throw error
      return courseId
    },
    onSuccess: (courseId) => qc.invalidateQueries({ queryKey: ['slides', courseId] }),
  })
}
