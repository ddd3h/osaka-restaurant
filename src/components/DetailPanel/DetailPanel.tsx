import { useEffect, useRef, useState } from 'react'
import { formatDistance, walkMinutes } from '../../lib/distance'
import { formatScore } from '../../lib/score'
import { Icon } from '../Icon/Icon'
import { PhotoGallery } from '../PhotoGallery/PhotoGallery'
import { TagChip } from '../TagChip/TagChip'
import type { ListedRestaurant } from '../../types'
import styles from './DetailPanel.module.css'

type Props = {
  restaurant: ListedRestaurant
  favorite: boolean
  onToggleFavorite: (id: string) => void
  onClose: () => void
}

function googleMapsUrl(r: ListedRestaurant): string {
  if (r.mapUrl) return r.mapUrl
  return `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
}

export function DetailPanel({ restaurant: r, favorite, onToggleFavorite, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [toast, setToast] = useState<string | null>(null)

  // 開いたら閉じるボタンにフォーカス。Esc でも閉じられる。
  useEffect(() => {
    closeRef.current?.focus()
  }, [r.id])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  const share = async () => {
    const url = window.location.href
    const data = { title: `${r.name} | 大阪めしMAP`, text: r.comment, url }

    try {
      if (navigator.share) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(url)
      setToast('リンクをコピーしました')
    } catch {
      // 共有シートのキャンセルはここに来る。エラー扱いにしない。
      setToast(null)
    }
  }

  return (
    <aside className={styles.panel} role="dialog" aria-label={`${r.name} の詳細`}>
      <button ref={closeRef} type="button" className={styles.close} onClick={onClose}>
        <Icon name="close" size={17} />
        <span className="srOnly">詳細を閉じる</span>
      </button>

      {/* key に店の id を渡すと店を切り替えたときギャラリーが作り直され、表示中の写真の位置が引き継がれず必ず1枚目に戻る。 */}
      <PhotoGallery key={r.id} photos={r.gallery} name={r.name} fallbackEmoji={r.emoji} />

      <div className={styles.body}>
        <p className={styles.area}>{r.area}</p>
        <h2 className={styles.name}>{r.name}</h2>

        <div className={styles.facts}>
          {r.rating !== undefined && (
            <span className={styles.rating}>
              <Icon name="star" size={14} filled /> {formatScore(r.rating)}
            </span>
          )}
          {r.budget && <span className={styles.fact}>{r.budget}</span>}
          {r.distanceM !== undefined && (
            <span className={styles.distance}>
              現在地から {formatDistance(r.distanceM)}・徒歩{walkMinutes(r.distanceM)}分
            </span>
          )}
        </div>

        {r.tags.length > 0 && (
          <ul className={styles.tags}>
            {r.tags.map((tag) => (
              <li key={tag}>
                <TagChip tag={tag} size="md" />
              </li>
            ))}
          </ul>
        )}

        <p className={styles.comment}>{r.comment}</p>

        <dl className={styles.info}>
          {r.address && (
            <>
              <dt>住所</dt>
              <dd>{r.address}</dd>
            </>
          )}
          {r.hours && (
            <>
              <dt>営業時間</dt>
              <dd>{r.hours}</dd>
            </>
          )}
        </dl>

        <div className={styles.actions}>
          <a
            className={styles.primary}
            href={googleMapsUrl(r)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Icon name="mapPin" /> Google マップで開く
          </a>
          {r.url && (
            <a className={styles.secondary} href={r.url} target="_blank" rel="noreferrer noopener">
              お店のページ
            </a>
          )}
          <button
            type="button"
            className={styles.secondary}
            data-on={favorite}
            aria-pressed={favorite}
            onClick={() => onToggleFavorite(r.id)}
          >
            <Icon name="heart" filled={favorite} />
            {favorite ? 'お気に入り済み' : 'お気に入り'}
          </button>
          <button type="button" className={styles.secondary} onClick={share}>
            <Icon name="link" /> 共有
          </button>
        </div>
      </div>

      <p className={styles.toast} data-show={toast !== null} role="status">
        {toast}
      </p>
    </aside>
  )
}
