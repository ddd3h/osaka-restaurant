import type { CSSProperties } from 'react'

/**
 * UI で使うアイコン一式。
 *
 * 絵文字はフォント任せで、端末ごとに形も色も大きさも変わってしまう。
 * ここは自前の SVG に固定して、線幅と色（`currentColor`）をサイトの見た目に揃える。
 *
 * 注意: お店のデータが持つ `emoji`（写真が無いときの代替）は**別物**。
 * あれは紹介文と同じ「内容」なので絵文字のままでよい。
 */
export type IconName =
  | 'logo'
  | 'map'
  | 'grid'
  | 'search'
  | 'close'
  | 'heart'
  | 'star'
  | 'link'
  | 'mapPin'
  | 'utensils'
  | 'searchOff'

type Props = {
  name: IconName
  /** 一辺の px。既定は本文と並べたときに収まる 18px */
  size?: number
  /** 塗りつぶす（heart / star の「オン」状態） */
  filled?: boolean
  className?: string
  style?: CSSProperties
}

/** 塗りつぶしに対応するアイコン。それ以外で filled を渡しても無視する。 */
const FILLABLE = new Set<IconName>(['heart', 'star'])

export function Icon({ name, size = 18, filled = false, className, style }: Props) {
  const solid = filled && FILLABLE.has(name)

  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      // 意味はボタン側のラベルが持つので、アイコン自体は読み上げから外す
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<IconName, React.ReactNode> = {
  // たこ焼き3個。ファビコンと同じモチーフ
  logo: (
    <>
      <circle cx="8" cy="9" r="4.6" />
      <circle cx="16.5" cy="11" r="4.2" />
      <circle cx="11.5" cy="17.5" r="4.2" />
    </>
  ),
  // 折りたたんだ地図
  map: (
    <>
      <path d="M2.5 6.2 9 3.5l6 2.7 6.5-2.7v14L15 20.2l-6-2.7-6.5 2.7z" />
      <path d="M9 3.5v14M15 6.2v14" />
    </>
  ),
  // 4分割のグリッド
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  heart: (
    <path d="M12 20.3s-7.6-4.6-9.2-9.2C1.6 7.7 3.7 4.5 7 4.5c2 0 3.9 1.2 5 3 1.1-1.8 3-3 5-3 3.3 0 5.4 3.2 4.2 6.6-1.6 4.6-9.2 9.2-9.2 9.2z" />
  ),
  star: <path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.7l6.1-.9z" />,
  // 鎖リンク。URL をコピー・共有する意味
  link: (
    <>
      <path d="M9.5 14.5a4.5 4.5 0 0 0 6.4 0l3.1-3.1a4.5 4.5 0 0 0-6.4-6.4l-1.6 1.6" />
      <path d="M14.5 9.5a4.5 4.5 0 0 0-6.4 0L5 12.6a4.5 4.5 0 0 0 6.4 6.4l1.6-1.6" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21.5s7-6.2 7-11.3A7 7 0 0 0 5 10.2c0 5.1 7 11.3 7 11.3z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  // フォークとナイフ
  utensils: (
    <>
      <path d="M6.5 2.8v7a2.5 2.5 0 0 0 5 0v-7M9 9.8v11.4" />
      <path d="M17.5 2.8c-1.7 1.4-2.5 3.3-2.5 5.6v4.4h4.2V8.4c0-2.3-.8-4.2-1.7-5.6z" />
      <path d="M17.5 12.8v8.4" />
    </>
  ),
  // 見つからない: 虫めがねに×
  searchOff: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21M8.3 8.3l4.4 4.4M12.7 8.3l-4.4 4.4" />
    </>
  ),
}
