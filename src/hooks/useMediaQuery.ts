import { useEffect, useState } from 'react'

/** メディアクエリの一致状態を購読する。SSR はしないので初期値も window から取る。 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** サイドバーとボトムシートの切り替え境界（index.css の 900px と揃える）。 */
export const MOBILE_QUERY = '(max-width: 899px)'
