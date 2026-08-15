import type { SortKey } from '../../types'
import type { GeoStatus } from '../../hooks/useGeolocation'
import { Icon } from '../Icon/Icon'
import styles from './SortControl.module.css'

type Props = {
  sort: SortKey
  onSortChange: (v: SortKey) => void
  favoritesOnly: boolean
  onFavoritesOnlyChange: (v: boolean) => void
  favoriteCount: number
  geoStatus: GeoStatus
  geoError: string | null
  /** 横幅が足りない置き場所（細いサイドバーなど）。お気に入りをハートだけにする */
  compact?: boolean
}

export function SortControl({
  sort,
  onSortChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  favoriteCount,
  geoStatus,
  geoError,
  compact = false,
}: Props) {
  return (
    <div className={styles.wrap} data-compact={compact}>
      <div className={styles.row}>
        <div className={styles.segment} role="group" aria-label="並び順">
          <button
            type="button"
            data-active={sort === 'recommended'}
            aria-pressed={sort === 'recommended'}
            onClick={() => onSortChange('recommended')}
          >
            おすすめ順
          </button>
          <button
            type="button"
            data-active={sort === 'score'}
            aria-pressed={sort === 'score'}
            onClick={() => onSortChange('score')}
          >
            {/* 表示は短く「食べログ順」、読み上げは「食べログ点数順」 */}
            食べログ<span className="srOnly">点数</span>順
          </button>
          <button
            type="button"
            data-active={sort === 'nearest'}
            aria-pressed={sort === 'nearest'}
            onClick={() => onSortChange('nearest')}
          >
            {geoStatus === 'locating' ? '取得中…' : '近い順'}
          </button>
        </div>

        <button
          type="button"
          className={styles.fav}
          data-active={favoritesOnly}
          aria-pressed={favoritesOnly}
          aria-label="お気に入りのみ表示"
          onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        >
          {/* 狭い画面では文字を落としてハートだけにする。
              読み上げ名は aria-label 側で持っているので変わらない */}
          <Icon name="heart" filled={favoritesOnly} />
          <span className={styles.favLabel}>お気に入り</span>
          {favoriteCount > 0 && <span className={styles.badge}>{favoriteCount}</span>}
        </button>
      </div>

      {geoStatus === 'error' && geoError && (
        <p className={styles.note} role="status">
          {geoError}。おすすめ順で表示しています。
        </p>
      )}
    </div>
  )
}
