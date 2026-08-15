import { useEffect, useRef } from 'react'
import { RestaurantCard } from '../RestaurantCard/RestaurantCard'
import type { ListedRestaurant } from '../../types'
import styles from './RestaurantList.module.css'

type Props = {
  items: ListedRestaurant[]
  selectedId: string | null
  favorites: ReadonlySet<string>
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onToggleFavorite: (id: string) => void
}

export function RestaurantList({
  items,
  selectedId,
  favorites,
  onSelect,
  onHover,
  onToggleFavorite,
}: Props) {
  const refs = useRef(new Map<string, HTMLLIElement>())

  // 地図のピンから選ばれたときに、そのカードまでスクロールする
  useEffect(() => {
    if (!selectedId) return
    refs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <ul className={styles.list}>
      {items.map((r) => (
        <li
          key={r.id}
          ref={(el) => {
            if (el) refs.current.set(r.id, el)
            else refs.current.delete(r.id)
          }}
        >
          <RestaurantCard
            restaurant={r}
            selected={r.id === selectedId}
            favorite={favorites.has(r.id)}
            onSelect={onSelect}
            onHover={onHover}
            onToggleFavorite={onToggleFavorite}
          />
        </li>
      ))}
    </ul>
  )
}
