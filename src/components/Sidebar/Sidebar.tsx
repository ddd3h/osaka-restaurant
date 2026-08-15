import type { Filters } from '../../hooks/useFilters'
import type { Favorites } from '../../hooks/useFavorites'
import type { Geolocation } from '../../hooks/useGeolocation'
import type { ViewMode } from '../../hooks/useViewMode'
import { EmptyState } from '../EmptyState/EmptyState'
import { Icon } from '../Icon/Icon'
import { FilterBar } from '../FilterBar/FilterBar'
import { RestaurantList } from '../RestaurantList/RestaurantList'
import type { SortKey } from '../../types'
import styles from './Sidebar.module.css'

type Props = {
  filters: Filters
  favorites: Favorites
  geo: Geolocation
  totalCount: number
  selectedId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onSortChange: (v: SortKey) => void
  mode: ViewMode
  onModeChange: (m: ViewMode) => void
}

export function Sidebar({
  filters,
  favorites,
  geo,
  totalCount,
  selectedId,
  onSelect,
  onHover,
  onSortChange,
  mode,
  onModeChange,
}: Props) {
  const { results } = filters

  return (
    <div className={styles.sidebar}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Icon name="logo" size={22} /> 大阪めしMAP
        </h1>
        <p className={styles.lead}>ぼくのすきな大阪のごはん、地図とタグで。</p>
      </header>

      <FilterBar
        filters={filters}
        favorites={favorites}
        geo={geo}
        totalCount={totalCount}
        onSortChange={onSortChange}
        mode={mode}
        onModeChange={onModeChange}
        layout="column"
      />

      <div className={styles.scroll}>
        {results.length === 0 ? (
          <EmptyState onReset={filters.reset} />
        ) : (
          <RestaurantList
            items={results}
            selectedId={selectedId}
            favorites={favorites.favorites}
            onSelect={onSelect}
            onHover={onHover}
            onToggleFavorite={favorites.toggle}
          />
        )}
      </div>
    </div>
  )
}
