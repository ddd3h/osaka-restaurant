import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'osaka-fav-v1'

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((v): v is string => typeof v === 'string'))
  } catch {
    // プライベートブラウジングなどで localStorage が使えない場合も落とさない
    return new Set()
  }
}

function write(ids: ReadonlySet<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    /* 保存できなくても操作自体は続けられる */
  }
}

export type Favorites = {
  favorites: ReadonlySet<string>
  toggle: (id: string) => void
  isFavorite: (id: string) => boolean
}

/** お気に入りを localStorage と同期する。別タブでの変更も storage イベントで拾う。 */
export function useFavorites(): Favorites {
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(read)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setFavorites(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      write(next)
      return next
    })
  }, [])

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  return { favorites, toggle, isFavorite }
}
