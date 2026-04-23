import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'eshrahli:favorites:v1'

function sanitizeFavoriteIds(ids) {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))]
}

function readFavoriteIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return sanitizeFavoriteIds(parsed)
  } catch {
    return []
  }
}

function writeFavoriteIds(ids) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

let favoriteIdsStore = readFavoriteIds()
const listeners = new Set()

function emitFavoritesChange() {
  listeners.forEach((listener) => listener())
}

function setFavoriteIdsStore(nextIds) {
  favoriteIdsStore = sanitizeFavoriteIds(nextIds)
  writeFavoriteIds(favoriteIdsStore)
  emitFavoritesChange()
}

function subscribeFavorites(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getFavoritesSnapshot() {
  return favoriteIdsStore
}

export function useFavorites() {
  const favoriteIds = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesSnapshot)

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return
      favoriteIdsStore = readFavoriteIds()
      emitFavoritesChange()
    }

    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const isFavorite = useCallback((slideId) => favoriteIdSet.has(slideId), [favoriteIdSet])

  const toggleFavorite = useCallback((slideId) => {
    if (typeof slideId !== 'string' || !slideId) return
    const next = favoriteIdsStore.includes(slideId)
      ? favoriteIdsStore.filter((id) => id !== slideId)
      : [slideId, ...favoriteIdsStore]
    setFavoriteIdsStore(next)
  }, [])

  const setFavorites = useCallback((ids) => {
    setFavoriteIdsStore(ids)
  }, [])

  return {
    favoriteIds,
    favoritesCount: favoriteIds.length,
    isFavorite,
    toggleFavorite,
    setFavorites,
  }
}
