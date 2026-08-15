import { useId, useState } from 'react'
import type { Filters } from '../../hooks/useFilters'
import type { Favorites } from '../../hooks/useFavorites'
import type { Geolocation } from '../../hooks/useGeolocation'
import { MOBILE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery'
import { Icon } from '../Icon/Icon'
import { SearchBar } from '../SearchBar/SearchBar'
import { SortControl } from '../SortControl/SortControl'
import { TagFilter } from '../TagFilter/TagFilter'
import type { SortKey } from '../../types'
import styles from './FilterBar.module.css'

type Props = {
  filters: Filters
  favorites: Favorites
  geo: Geolocation
  onSortChange: (v: SortKey) => void
  /** column = サイドバー（縦積み） / row = グリッドの上帯（横並び） */
  layout: 'column' | 'row'
}

/**
 * 絞り込みUIひとまとめ。サイドバーとグリッドの上帯で同じものを使い回す。
 * 出す DOM は両レイアウトで同じで、見た目の差は data-layout を見た CSS で吸収する。
 *
 * 狭い画面では帯が縦を食って一覧が押し出されるので、既定では検索だけを出し、
 * タグ・並び順・お気に入りは絞り込みボタンの中に畳む。
 * 件数と表示切替は一覧の直前（ResultCount のある行）が持つ。
 */
export function FilterBar({
  filters,
  favorites,
  geo,
  onSortChange,
  layout,
}: Props) {
  const { results } = filters
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [open, setOpen] = useState(false)
  const panelId = useId()

  // 畳むのは狭い画面のときだけ。PC は今までどおり全部見えている
  const collapsible = isMobile
  const collapsed = collapsible && !open

  // 閉じていても「何かで絞っている」ことが分かるようにボタンへ数を出す。
  // 並び順は結果を減らさないので数えない。
  const activeCount = filters.tags.length + (filters.favoritesOnly ? 1 : 0)

  return (
    <div className={styles.bar} data-layout={layout}>
      <div className={styles.search}>
        <SearchBar
          value={filters.query}
          onChange={filters.setQuery}
          resultCount={results.length}
        />
      </div>

      {collapsible && (
        <button
          type="button"
          className={styles.toggle}
          data-on={open}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'chevronUp' : 'filter'} />
          <span className="srOnly">絞り込み</span>
          {activeCount > 0 && (
            <span className={styles.badge}>
              {activeCount}
              <span className="srOnly">件の条件を適用中</span>
            </span>
          )}
        </button>
      )}

      <div className={styles.panel} id={panelId} data-collapsed={collapsed}>
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
      </div>
    </div>
  )
}
