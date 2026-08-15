import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'osaka-view-v1'

/** 表示モード: 地図中心か、カードを敷き詰めるグリッドか。 */
export type ViewMode = 'map' | 'grid'

const DEFAULT_MODE: ViewMode = 'map'

function isViewMode(v: unknown): v is ViewMode {
  return v === 'map' || v === 'grid'
}

function read(): ViewMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MODE
    const parsed: unknown = JSON.parse(raw)
    // 知らない値が入っていたら既定値に落とす（旧バージョンの残骸や手書き対策）
    return isViewMode(parsed) ? parsed : DEFAULT_MODE
  } catch {
    // プライベートブラウジングなどで localStorage が使えない場合も落とさない
    return DEFAULT_MODE
  }
}

function write(mode: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mode))
  } catch {
    /* 保存できなくても切り替え自体は続けられる */
  }
}

export type ViewModeState = {
  mode: ViewMode
  setMode: (m: ViewMode) => void
}

/** 表示モードを localStorage と同期する。別タブでの変更も storage イベントで拾う。 */
export function useViewMode(): ViewModeState {
  const [mode, setModeState] = useState<ViewMode>(read)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setModeState(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setMode = useCallback((m: ViewMode) => {
    setModeState(m)
    write(m)
  }, [])

  return { mode, setMode }
}
