import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { EmptyState } from '../EmptyState/EmptyState'
import { RestaurantTile } from '../RestaurantTile/RestaurantTile'
import type { ListedRestaurant } from '../../types'
import styles from './RestaurantGrid.module.css'

type Props = {
  items: ListedRestaurant[]
  selectedId: string | null
  favorites: ReadonlySet<string>
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onToggleFavorite: (id: string) => void
  /** 0件のとき EmptyState に渡す */
  onReset: () => void
  /** 地図パネル。App が MapView を入れて渡す（グリッドは MapView を import しない） */
  mapSlot: ReactNode
}

/** 写真タイルを敷き詰めるグリッド表示。地図は最初の子として置き、広い画面では右上に寄せる。 */
export function RestaurantGrid({
  items,
  selectedId,
  favorites,
  onSelect,
  onHover,
  onToggleFavorite,
  onReset,
  mapSlot,
}: Props) {
  const refs = useRef(new Map<string, HTMLDivElement>())
  const empty = items.length === 0

  // 地図のピンから選ばれたときに、そのタイルまでスクロールする
  useEffect(() => {
    if (!selectedId) return
    refs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div className={styles.wrap}>
      {/* 0件でも地図は残す。タイルは描かず、下に EmptyState を出す */}
      <div className={styles.grid} data-empty={empty}>
        <div className={styles.mapCard}>{mapSlot}</div>

        {items.map((r) => (
          <div
            key={r.id}
            className={styles.cell}
            ref={(el) => {
              if (el) refs.current.set(r.id, el)
              else refs.current.delete(r.id)
            }}
          >
            <RestaurantTile
              restaurant={r}
              selected={r.id === selectedId}
              favorite={favorites.has(r.id)}
              onSelect={onSelect}
              onHover={onHover}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>

      {empty && <EmptyState onReset={onReset} />}
    </div>
  )
}
