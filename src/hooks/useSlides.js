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
        .order('file_name', { ascending: true })
        .order('slide_number', { ascending: true })
        .order('created_at', { ascending: true })
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

export function useAllSlides() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['slides', 'all', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
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

export function useRenameLecture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, slideIds, name }) => {
      const cleanedName = name?.trim()
      if (!courseId || !Array.isArray(slideIds) || slideIds.length === 0 || !cleanedName) {
        throw new Error('Invalid lecture rename data')
      }

      const { error } = await supabase
        .from('slides')
        .update({ file_name: cleanedName })
        .in('id', slideIds)

      if (error) throw error
      return { courseId }
    },
    onSuccess: ({ courseId }) => {
      qc.invalidateQueries({ queryKey: ['slides', courseId] })
      qc.invalidateQueries({ queryKey: ['slides', 'all'] })
      qc.invalidateQueries({ queryKey: ['slide'] })
    },
  })
}
