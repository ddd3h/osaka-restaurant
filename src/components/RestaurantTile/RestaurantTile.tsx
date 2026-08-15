import { formatDistance } from '../../lib/distance'
import { formatScore } from '../../lib/score'
import { Icon } from '../Icon/Icon'
import { TagChip } from '../TagChip/TagChip'
import type { ListedRestaurant } from '../../types'
import styles from './RestaurantTile.module.css'

type Props = {
  restaurant: ListedRestaurant
  selected: boolean
  favorite: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onToggleFavorite: (id: string) => void
}

/** グリッド表示用の大きい写真タイル。Props は RestaurantCard と同じ。 */
export function RestaurantTile({
  restaurant: r,
  selected,
  favorite,
  onSelect,
  onHover,
  onToggleFavorite,
}: Props) {
  // サムネは縮小版（cover）で足りる。原寸はギャラリーだけが使う
  const photo = r.cover

  return (
    <article
      className={styles.tile}
      data-selected={selected}
      onMouseEnter={() => onHover(r.id)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        className={styles.hit}
        onClick={() => onSelect(r.id)}
        onFocus={() => onHover(r.id)}
        onBlur={() => onHover(null)}
      >
        <span className="srOnly">{r.name} の詳細を見る</span>
      </button>

      <div className={styles.photo} aria-hidden="true">
        {photo ? (
          <img src={photo} alt="" loading="lazy" />
        ) : (
          <span className={styles.photoEmoji}>{r.emoji}</span>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{r.name}</h3>

        <p className={styles.meta}>
          <span className={styles.area}>{r.area}</span>
          {r.rating !== undefined && (
            <span className={styles.rating}>
              <Icon name="star" size={13} filled />
              {formatScore(r.rating)}
            </span>
          )}
          {r.budget && <span>{r.budget}</span>}
          {r.distanceM !== undefined && (
            <span className={styles.distance}>{formatDistance(r.distanceM)}</span>
          )}
        </p>

        {r.tags.length > 0 && (
          <ul className={styles.tags}>
            {r.tags.map((tag) => (
              <li key={tag}>
                <TagChip tag={tag} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={styles.fav}
        data-on={favorite}
        aria-pressed={favorite}
        onClick={() => onToggleFavorite(r.id)}
      >
        <Icon name="heart" filled={favorite} />
        <span className="srOnly">
          {r.name} を{favorite ? 'お気に入りから外す' : 'お気に入りに追加'}
        </span>
      </button>
    </article>
  )
}
