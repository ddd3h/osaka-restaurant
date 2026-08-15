import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { DetailPanel } from './components/DetailPanel/DetailPanel'
import { Icon } from './components/Icon/Icon'
import { FilterBar } from './components/FilterBar/FilterBar'
import { MobileSheet } from './components/MobileSheet/MobileSheet'
import { RestaurantGrid } from './components/RestaurantGrid/RestaurantGrid'
import { ResultCount } from './components/ResultCount/ResultCount'
import { ViewToggle } from './components/ViewToggle/ViewToggle'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useFavorites } from './hooks/useFavorites'
import { useFilters } from './hooks/useFilters'
import { useGeolocation } from './hooks/useGeolocation'
import { useMediaQuery, MOBILE_QUERY } from './hooks/useMediaQuery'
import { useRestaurants } from './hooks/useRestaurants'
import { useViewMode } from './hooks/useViewMode'
import type { SortKey } from './types'
import styles from './App.module.css'

// maplibre-gl は重い（gzip で 200kB 超）。リストと検索を先に見せたいので遅延読み込みする。
const MapView = lazy(() =>
  import('./components/MapView/MapView').then((m) => ({ default: m.MapView })),
)

/** モバイルのシートに隠れる高さの目安。地図を寄せるときの余白に使う。 */
const SHEET_INSET_PX = 220
/** PC の詳細パネルの幅 + 余白。 */
const DETAIL_INSET_PX = 432

export default function App() {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const { mode, setMode } = useViewMode()
  const geo = useGeolocation()
  const favorites = useFavorites()
  const restaurants = useRestaurants(geo.position)
  const filters = useFilters(restaurants, favorites.favorites)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // 選択状態は URL がそのまま持つ（共有リンクで同じ画面が開く）
  const navigate = useNavigate()
  const match = useMatch('/r/:id')
  const selectedId = match?.params.id ?? null
  const selected = restaurants.find((r) => r.id === selectedId) ?? null

  const handleSelect = useCallback((id: string) => navigate(`/r/${id}`), [navigate])
  const handleClear = useCallback(() => navigate('/'), [navigate])

  const { sort, setSort } = filters
  const handleSortChange = useCallback(
    (next: SortKey) => {
      setSort(next)
      // 現在地の許可は「近い順」を選んだこの瞬間にだけ求める
      if (next === 'nearest' && geo.status !== 'granted') geo.request()
    },
    [setSort, geo],
  )

  // 現在地が取れなかったら黙っておすすめ順へ戻す（理由は SortControl が出す）
  useEffect(() => {
    if (geo.status === 'error' && sort === 'nearest') setSort('recommended')
  }, [geo.status, sort, setSort])

  const isGrid = mode === 'grid'

  const sidebar = (
    <Sidebar
      filters={filters}
      favorites={favorites}
      geo={geo}
      totalCount={restaurants.length}
      selectedId={selectedId}
      onSelect={handleSelect}
      onHover={setHoveredId}
      onSortChange={handleSortChange}
      mode={mode}
      onModeChange={setMode}
    />
  )

  // 地図はモードで置き場所が変わる。地図モードでは全画面、グリッドモードでは
  // RestaurantGrid の中の1タイル（mapSlot）に入る。
  // DOM 上の親が変わる = React には別ツリーに見えるので、モードを切り替えるたびに
  // MapView はアンマウントされ、地図インスタンスも作り直しになる。
  // 切替はユーザーが明示的に押したときだけ起きる操作なので、この初期化コストは許容する。
  // （地図を生かしたまま移すには両モードのレイアウトを地図の都合に合わせて縛ることになり、
  //   得られるものに対して割に合わない。）
  const mapView = (
    <Suspense fallback={<div className={styles.mapLoading}>地図を読み込み中…</div>}>
      <MapView
        items={filters.results}
        selectedId={selectedId}
        hoveredId={hoveredId}
        origin={geo.position}
        // グリッドの小窓にはシートも詳細パネルも被らないので、インセットは足さない
        bottomInset={!isGrid && isMobile ? SHEET_INSET_PX : 0}
        rightInset={!isGrid && !isMobile && selected ? DETAIL_INSET_PX : 0}
        compact={isGrid}
        onSelect={handleSelect}
        onHover={setHoveredId}
        onClear={handleClear}
      />
    </Suspense>
  )

  return (
    <div className={styles.shell}>
      {isGrid ? (
        // グリッドモード: 上に絞り込みの帯、下にカードを敷き詰める。
        // モバイルでもボトムシートは出さず、画面全部をグリッドに使う。
        <div className={styles.gridShell}>
          <div className={styles.gridBar}>
            <h1 className={styles.gridBrand}>
              <Icon name="logo" size={22} /> 大阪めしMAP
            </h1>
            <div className={styles.gridBarMain}>
              <FilterBar
                filters={filters}
                favorites={favorites}
                geo={geo}
                onSortChange={handleSortChange}
                layout="row"
              />
            </div>
          </div>

          <div className={styles.gridBody}>
            <div className={styles.gridCount}>
              <ResultCount
                shown={filters.results.length}
                total={restaurants.length}
                isActive={filters.isActive}
                onReset={filters.reset}
              />
              <ViewToggle mode={mode} onChange={setMode} />
            </div>

            <RestaurantGrid
              items={filters.results}
              selectedId={selectedId}
              favorites={favorites.favorites}
              onSelect={handleSelect}
              onHover={setHoveredId}
              onToggleFavorite={favorites.toggle}
              onReset={filters.reset}
              mapSlot={mapView}
            />
          </div>
        </div>
      ) : (
        // 地図モード: PC はサイドバー + 全画面地図、モバイルはボトムシート。
        <>
          {!isMobile && <aside className={styles.aside}>{sidebar}</aside>}

          <main className={styles.mapArea}>
            {isMobile && (
              <h1 className={styles.brand}>
                <Icon name="logo" size={22} /> 大阪めしMAP
              </h1>
            )}
            {mapView}
          </main>

          {isMobile && <MobileSheet>{sidebar}</MobileSheet>}
        </>
      )}

      {/* 詳細と「見つかりません」はモード分岐の外。
          共有リンクの直開き・Esc・共有ボタンの振る舞いをモードで変えないため。 */}
      {selected && (
        <DetailPanel
          restaurant={selected}
          favorite={favorites.isFavorite(selected.id)}
          onToggleFavorite={favorites.toggle}
          onClose={handleClear}
        />
      )}

      {selectedId && !selected && (
        <aside className={styles.notFound} role="dialog" aria-label="お店が見つかりません">
          <p className={styles.notFoundEmoji}>
            <Icon name="searchOff" size={40} />
          </p>
          <p className={styles.notFoundTitle}>そのお店は見つかりませんでした</p>
          <p className={styles.notFoundText}>リンクが古いか、まだ載せていないお店かもしれません。</p>
          <button type="button" className={styles.notFoundBack} onClick={handleClear}>
            一覧にもどる
          </button>
        </aside>
      )}
    </div>
  )
}
