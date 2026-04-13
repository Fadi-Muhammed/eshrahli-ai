import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export function useCourses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

export function useCreateCourse() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, name_ar }) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({ name, name_ar, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useCreateCoursesBatch() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (courses) => {
      const payload = courses
        .map((course) => ({
          name: course.name?.trim(),
          name_ar: (course.name_ar ?? course.name)?.trim(),
          user_id: user.id,
        }))
        .filter((course) => course.name)

      if (!payload.length) return []

      const { data, error } = await supabase
        .from('courses')
        .insert(payload)
        .select('*')

      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name, name_ar }) => {
      const { data, error } = await supabase
        .from('courses')
        .update({ name, name_ar })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId) => {
      const { error } = await supabase.from('courses').delete().eq('id', courseId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })
}
