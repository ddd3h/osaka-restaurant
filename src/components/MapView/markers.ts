import { Marker, type MapLibreMap } from 'maplibre-gl'
import type { ListedRestaurant } from '../../types'
import styles from './MapView.module.css'

export type PinEntry = {
  marker: Marker
  /** 状態を塗るのは中のボタン。marker 要素そのものは maplibre の持ち物 */
  el: HTMLButtonElement
}

type Handlers = {
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

/**
 * ピン1本ぶんの DOM。React の外で作るので、クラス名は CSS Modules から引く。
 *
 * marker のルート要素には自前のスタイルを一切当てない。maplibre は
 * `.maplibregl-marker` に `position: absolute` と座標の `transform` を載せており、
 * そこへ CSS Modules の position / transform をぶつけると位置がずれるため、
 * 見た目は必ず内側のボタンに持たせる。
 */
function createPin(r: ListedRestaurant, handlers: Handlers): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = styles.pin
  el.dataset.id = r.id
  el.setAttribute('aria-label', `${r.name}（${r.area}）`)
  el.title = r.name

  const bubble = document.createElement('span')
  bubble.className = styles.pinBubble
  bubble.setAttribute('aria-hidden', 'true')

  // ピンに載せるのは代表写真の1枚だけ。gallery は解決済み URL なのでそのまま使う
  const photo = r.gallery[0]
  if (photo) {
    const img = document.createElement('img')
    img.src = photo
    img.alt = ''
    img.draggable = false
    bubble.appendChild(img)
  } else {
    // 写真が無い店は絵文字で代替する
    bubble.textContent = r.emoji
    bubble.dataset.fallback = 'true'
  }

  el.append(bubble)

  el.addEventListener('click', (e) => {
    e.stopPropagation()
    handlers.onSelect(r.id)
  })
  el.addEventListener('mouseenter', () => handlers.onHover(r.id))
  el.addEventListener('mouseleave', () => handlers.onHover(null))
  el.addEventListener('focus', () => handlers.onHover(r.id))
  el.addEventListener('blur', () => handlers.onHover(null))

  return el
}

/**
 * 表示中の店に合わせてマーカーを増減させる（既存ぶんは作り直さない）。
 * handlers は常に最新の関数を参照する ref 経由で渡すこと。
 */
export function syncMarkers(
  map: MapLibreMap,
  entries: Map<string, PinEntry>,
  items: ListedRestaurant[],
  handlers: Handlers,
): void {
  const next = new Set(items.map((r) => r.id))

  for (const [id, entry] of entries) {
    if (next.has(id)) continue
    entry.marker.remove()
    entries.delete(id)
  }

  for (const r of items) {
    if (entries.has(r.id)) continue
    const el = createPin(r, handlers)
    // ルートは素の div。スタイルを持たせないことで maplibre の座標指定と衝突させない
    const root = document.createElement('div')
    root.appendChild(el)

    // しっぽが無い丸ピンなので、円の中心がそのまま座標になる
    const marker = new Marker({ element: root, anchor: 'center' })
      .setLngLat([r.lng, r.lat])
      .addTo(map)

    // maplibre がルートに付ける role="button" / aria-label は、中の本物のボタンと
    // 二重に読み上げられてしまうので外す
    root.removeAttribute('role')
    root.removeAttribute('aria-label')
    root.removeAttribute('tabindex')

    entries.set(r.id, { marker, el })
  }
}

/** 選択・ホバー状態を DOM の data 属性に反映する（マーカーは作り直さない）。 */
export function paintMarkerStates(
  entries: Map<string, PinEntry>,
  selectedId: string | null,
  hoveredId: string | null,
): void {
  for (const [id, { el, marker }] of entries) {
    const selected = id === selectedId
    el.dataset.selected = String(selected)
    el.dataset.hovered = String(id === hoveredId)
    // 選択中のピンを他のピンの上に出す
    marker.getElement().style.zIndex = selected ? '3' : id === hoveredId ? '2' : '1'
  }
}

export function removeAllMarkers(entries: Map<string, PinEntry>): void {
  for (const { marker } of entries.values()) marker.remove()
  entries.clear()
}
