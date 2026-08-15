import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import styles from './PhotoGallery.module.css'

type Props = {
  /** 表示する写真URL（解決済み）。0枚もありうる */
  photos: string[]
  /** alt に使う店名 */
  name: string
  /** photos が空のときに出す絵文字 */
  fallbackEmoji: string
}

/**
 * 写真ギャラリー（メイン1枚 + サムネ列）。
 *
 * 表示中の index は内部 state で持つ。別のお店に切り替わったときに1枚目へ戻すのは
 * **呼び出し側が key を付け替える前提**（例: `<PhotoGallery key={r.id} … />`）。
 * そのため photos の変化を useEffect で監視して index をリセットする処理は
 * 意図的に書いていない。key を付け忘れると前の店の枚数目が残るので注意。
 */
export function PhotoGallery({ photos, name, fallbackEmoji }: Props) {
  const [index, setIndex] = useState(0)

  const total = photos.length
  // 万一 photos が縮んでも範囲外を見に行かないようにクランプしておく
  const current = Math.min(index, Math.max(total - 1, 0))
  // サムネ列と枚数バッジは2枚以上のときだけ
  const hasThumbs = total > 1

  // 1枚しかないときに「1枚中1枚目」と読ませても情報がないので素の文言にする
  const mainAlt = hasThumbs ? `${name}の写真 ${total}枚中${current + 1}枚目` : `${name}の写真`

  // ArrowLeft / ArrowRight で前後の写真へ。端では止める（ループしない）
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!hasThumbs) return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setIndex(Math.min(current + 1, total - 1))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setIndex(Math.max(current - 1, 0))
    }
  }

  return (
    <div className={styles.gallery} onKeyDown={onKeyDown}>
      <div className={styles.main}>
        {total > 0 ? (
          // 詳細を開いた直後に必ず見える位置なので eager で読む
          <img src={photos[current]} alt={mainAlt} loading="eager" />
        ) : (
          <span className={styles.emoji} aria-hidden="true">
            {fallbackEmoji}
          </span>
        )}

        {hasThumbs && (
          // 枚数は alt でも読み上げられるので、バッジは目で見る人向け
          <span className={styles.badge} aria-hidden="true">
            {`${current + 1} / ${total}`}
          </span>
        )}
      </div>

      {hasThumbs && (
        <ul className={styles.thumbs} aria-label={`${name}の写真一覧`}>
          {photos.map((photo, i) => (
            <li key={`${i}-${photo}`}>
              <button
                type="button"
                className={styles.thumb}
                aria-label={`${i + 1}枚目を表示`}
                aria-pressed={i === current}
                onClick={() => setIndex(i)}
              >
                {/* ボタン側にラベルがあるので img は装飾扱い */}
                <img src={photo} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
