import { useEffect, useMemo, useRef } from 'react'
import { LngLatBounds, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMapLibre } from '../../hooks/useMapLibre'
import { paintMarkerStates, removeAllMarkers, syncMarkers, type PinEntry } from './markers'
import type { LatLng } from '../../lib/distance'
import type { ListedRestaurant } from '../../types'
import styles from './MapView.module.css'

const FIT_DEBOUNCE_MS = 200
const SELECTED_ZOOM = 15.5
/** 寄せるときの余白の基準値。全画面のとき */
const PAD_PX = 60
/** 同・小窓のとき。320×240 程度で 60px も空けると寄りすぎて何も見えない */
const PAD_COMPACT_PX = 24

type Props = {
  items: ListedRestaurant[]
  selectedId: string | null
  hoveredId: string | null
  origin: LatLng | null
  /** モバイルのボトムシートに隠れる高さ。地図の可視領域の計算に使う */
  bottomInset?: number
  /** PC で詳細パネルに隠れる幅。選択したピンがパネルの裏に入らないようにする */
  rightInset?: number
  /** グリッドの1タイルのような小窓に置くとき。寄せるときの余白を詰める */
  compact?: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onClear: () => void
}

export function MapView({
  items,
  selectedId,
  hoveredId,
  origin,
  bottomInset = 0,
  rightInset = 0,
  compact = false,
  onSelect,
  onHover,
  onClear,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { map, ready } = useMapLibre(containerRef)
  const entries = useRef(new Map<string, PinEntry>())

  // マーカーは React の外で作るので、最新のコールバックを ref 経由で呼ぶ
  const onSelectRef = useRef(onSelect)
  const onHoverRef = useRef(onHover)
  const onClearRef = useRef(onClear)
  const selectedIdRef = useRef(selectedId)
  useEffect(() => {
    onSelectRef.current = onSelect
    onHoverRef.current = onHover
    onClearRef.current = onClear
    selectedIdRef.current = selectedId
  })

  const handlers = useMemo(
    () => ({
      onSelect: (id: string) => onSelectRef.current(id),
      onHover: (id: string | null) => onHoverRef.current(id),
    }),
    [],
  )

  // 枠の大きさで基準の余白を変える。インセットはこれに足し込む
  const pad = compact ? PAD_COMPACT_PX : PAD_PX

  // 全体を収めるときの余白。詳細パネルの開閉で寄せ直さないよう rightInset は含めない
  const fitPadding = useMemo(
    () => ({ top: pad, right: pad, bottom: pad + bottomInset, left: pad }),
    [pad, bottomInset],
  )
  // 1軒に寄るときは、詳細パネルに隠れないところへ置く
  const flyPadding = useMemo(
    () => ({ top: pad, right: pad + rightInset, bottom: pad + bottomInset, left: pad }),
    [pad, bottomInset, rightInset],
  )

  // 地図の余白クリックで選択解除
  useEffect(() => {
    if (!map) return
    const onMapClick = () => onClearRef.current()
    map.on('click', onMapClick)
    return () => {
      map.off('click', onMapClick)
    }
  }, [map])

  // 表示中の店にマーカーを合わせる
  useEffect(() => {
    if (!map || !ready) return
    syncMarkers(map, entries.current, items, handlers)
    paintMarkerStates(entries.current, selectedId, hoveredId)
    // selectedId / hoveredId はここでは依存に入れない（別 effect で塗り直す）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, items, handlers])

  useEffect(() => {
    const current = entries.current
    return () => removeAllMarkers(current)
  }, [])

  // 選択・ホバーは DOM の data 属性だけ更新する
  useEffect(() => {
    paintMarkerStates(entries.current, selectedId, hoveredId)
  }, [selectedId, hoveredId, items])

  // 絞り込み結果が変わったら全部入るように寄せる。並び替えだけでは動かさない
  const boundsKey = useMemo(
    () => items.map((r) => r.id).sort().join(','),
    [items],
  )
  // 共有リンクで特定の店を開いた初回だけは、全体に寄せ直さず flyTo を優先する。
  // 判定を map インスタンスで持つことで、StrictMode の二重マウントでも一度きりになる。
  const initialFitDone = useRef<unknown>(null)

  useEffect(() => {
    if (!map || !ready || items.length === 0) return

    if (initialFitDone.current !== map) {
      initialFitDone.current = map
      if (selectedIdRef.current) return
    }

    const timer = setTimeout(() => {
      const bounds = new LngLatBounds()
      for (const r of items) bounds.extend([r.lng, r.lat])
      map.fitBounds(bounds, { padding: fitPadding, maxZoom: 15, duration: 600 })
    }, FIT_DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // boundsKey が同じなら並び替えだけなので寄せ直さない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, boundsKey, fitPadding])

  // 選択された店へ寄る
  useEffect(() => {
    if (!map || !ready || !selectedId) return
    const target = items.find((r) => r.id === selectedId)
    if (!target) return

    map.flyTo({
      center: [target.lng, target.lat],
      zoom: Math.max(map.getZoom(), SELECTED_ZOOM),
      padding: flyPadding,
      duration: 700,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, selectedId, flyPadding])

  // 現在地マーカー
  useEffect(() => {
    if (!map || !ready || !origin) return
    const el = document.createElement('div')
    el.className = styles.here
    el.setAttribute('aria-label', '現在地')
    const marker = new Marker({ element: el })
      .setLngLat([origin.lng, origin.lat])
      .addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, ready, origin])

  return <div ref={containerRef} className={styles.map} role="application" aria-label="お店の地図" />
}
