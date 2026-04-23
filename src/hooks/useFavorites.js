import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'eshrahli:favorites:v1'
const FAVORITES_UPDATED_EVENT = 'eshrahli:favorites:updated'

function readFavoriteIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeFavoriteIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: ids }))
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteIds())

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setFavoriteIds(readFavoriteIds())
    }

    const onFavoritesUpdated = (event) => {
      const ids = Array.isArray(event.detail) ? event.detail : readFavoriteIds()
      setFavoriteIds(ids.filter((id) => typeof id === 'string'))
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(FAVORITES_UPDATED_EVENT, onFavoritesUpdated)
    }
  }, [])

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const isFavorite = useCallback((slideId) => favoriteIdSet.has(slideId), [favoriteIdSet])

  const toggleFavorite = useCallback((slideId) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(slideId)
        ? prev.filter((id) => id !== slideId)
        : [slideId, ...prev]
      writeFavoriteIds(next)
      return next
    })
  }, [])

  return {
    favoriteIds,
    favoritesCount: favoriteIds.length,
    isFavorite,
    toggleFavorite,
  }
}
