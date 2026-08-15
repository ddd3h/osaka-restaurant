import type { Filters } from '../../hooks/useFilters'
import type { Favorites } from '../../hooks/useFavorites'
import type { Geolocation } from '../../hooks/useGeolocation'
import type { ViewMode } from '../../hooks/useViewMode'
import { SearchBar } from '../SearchBar/SearchBar'
import { SortControl } from '../SortControl/SortControl'
import { TagFilter } from '../TagFilter/TagFilter'
import { ViewToggle } from '../ViewToggle/ViewToggle'
import type { SortKey } from '../../types'
import styles from './FilterBar.module.css'

type Props = {
  filters: Filters
  favorites: Favorites
  geo: Geolocation
  totalCount: number
  onSortChange: (v: SortKey) => void
  mode: ViewMode
  onModeChange: (m: ViewMode) => void
  /** column = サイドバー（縦積み） / row = グリッドの上帯（横並び） */
  layout: 'column' | 'row'
}

/**
 * 絞り込みUIひとまとめ。サイドバーとグリッドの上帯で同じものを使い回す。
 * 出す DOM は両レイアウトで完全に同じで、見た目の差は data-layout を見た CSS だけで吸収する。
 */
export function FilterBar({
  filters,
  favorites,
  geo,
  totalCount,
  onSortChange,
  mode,
  onModeChange,
  layout,
}: Props) {
  const { results } = filters

  return (
    <div className={styles.bar} data-layout={layout}>
      <div className={styles.search}>
        <SearchBar
          value={filters.query}
          onChange={filters.setQuery}
          resultCount={results.length}
        />
      </div>

      <div className={styles.tags}>
        {/* タグが増えると一覧やグリッドが下へ押し出されるので、どこでも上位だけ出す */}
        <TagFilter facets={filters.facets} onToggle={filters.toggleTag} collapsible />
      </div>

      <div className={styles.sort}>
        <SortControl
          sort={filters.sort}
          onSortChange={onSortChange}
          favoritesOnly={filters.favoritesOnly}
          onFavoritesOnlyChange={filters.setFavoritesOnly}
          favoriteCount={favorites.favorites.size}
          geoStatus={geo.status}
          geoError={geo.error}
          /* サイドバーは 380px しかないので、お気に入りはハートだけにして
             並び順と1行に収める */
          compact={layout === 'column'}
        />
      </div>

      {/* 表示モードの切り替えは地図でもグリッドでも常に見えるところに置く */}
      <div className={styles.meta}>
        <ViewToggle mode={mode} onChange={onModeChange} />
        <p className={styles.count}>
          <strong>{results.length}</strong> / {totalCount} 軒
          {filters.isActive && (
            <button type="button" className={styles.reset} onClick={filters.reset}>
              リセット
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
