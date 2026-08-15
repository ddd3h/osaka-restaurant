import { useCallback, useMemo, useState } from 'react'
import { filterRestaurants, sortRestaurants, tagCounts } from '../lib/filter'
import type { ListedRestaurant, SortKey } from '../types'

export type TagFacet = {
  tag: string
  /** このタグを追加で選んだときに残る件数。0 ならその組み合わせは空 */
  count: number
  selected: boolean
}

export type Filters = {
  query: string
  setQuery: (v: string) => void
  tags: string[]
  toggleTag: (tag: string) => void
  favoritesOnly: boolean
  setFavoritesOnly: (v: boolean) => void
  sort: SortKey
  setSort: (v: SortKey) => void
  /** 絞り込み + 並べ替え済みの結果 */
  results: ListedRestaurant[]
  /** チップ表示用。全データ中の出現数が多い順 */
  facets: TagFacet[]
  isActive: boolean
  reset: () => void
}

export function useFilters(
  all: ListedRestaurant[],
  favorites: ReadonlySet<string>,
): Filters {
  const [query, setQuery] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('recommended')

  const criteria = useMemo(
    () => ({ query, tags, favoritesOnly, favorites }),
    [query, tags, favoritesOnly, favorites],
  )

  const results = useMemo(
    () => sortRestaurants(filterRestaurants(all, criteria), sort),
    [all, criteria, sort],
  )

  // チップの件数は「そのタグを足したら何件残るか」。0 件の組み合わせを事前に見せる。
  const facets = useMemo<TagFacet[]>(() => {
    const order = [...tagCounts(all).keys()]
    return order.map((tag) => {
      const selected = tags.includes(tag)
      const nextTags = selected ? tags : [...tags, tag]
      return {
        tag,
        selected,
        count: filterRestaurants(all, { ...criteria, tags: nextTags }).length,
      }
    })
  }, [all, criteria, tags])

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }, [])

  const reset = useCallback(() => {
    setQuery('')
    setTags([])
    setFavoritesOnly(false)
  }, [])

  const isActive = query !== '' || tags.length > 0 || favoritesOnly

  return {
    query,
    setQuery,
    tags,
    toggleTag,
    favoritesOnly,
    setFavoritesOnly,
    sort,
    setSort,
    results,
    facets,
    isActive,
    reset,
  }
}
