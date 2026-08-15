import { useEffect, useState, type RefObject } from 'react'
import { MapLibreMap, NavigationControl } from 'maplibre-gl'

/** OpenFreeMap の positron。灰色基調なので、ビビッドなピンが最大限目立つ。 */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

/** 大阪ミナミあたり。初期表示はここから fitBounds で調整される。 */
const INITIAL_CENTER: [number, number] = [135.502, 34.669]
const INITIAL_ZOOM = 12.2

export type MapHandle = {
  map: MapLibreMap | null
  ready: boolean
}

export function useMapLibre(container: RefObject<HTMLDivElement | null>): MapHandle {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = container.current
    if (!el) return

    const instance = new MapLibreMap({
      container: el,
      style: STYLE_URL,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
      // ピンチ回転は誤操作が多いので切る
      pitchWithRotate: false,
      dragRotate: false,
    })

    instance.touchZoomRotate.disableRotation()
    instance.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')

    const onLoad = () => {
      tintMapStyle(instance)
      setReady(true)
    }
    instance.on('load', onLoad)
    // スタイルやタイルの取得に失敗したとき、黙って白い箱にならないよう必ず記録する
    instance.on('error', (e) => console.error('[maplibre]', e.error?.message ?? e))
    setMap(instance)

    return () => {
      instance.remove()
      setMap(null)
      setReady(false)
    }
  }, [container])

  return { map, ready }
}

/**
 * positron の淡いグレーに、サイトのパレットをうっすら足す。
 * スタイル側のレイヤ名は変わりうるので、存在しないものは黙って飛ばす。
 */
function tintMapStyle(map: MapLibreMap): void {
  const tints: Array<[layer: string, value: string]> = [
    ['water', '#D6F4EF'],
    ['landcover-grass', '#EAF7DC'],
    ['landuse-grass', '#EAF7DC'],
    ['park', '#E4F6D8'],
    ['landcover_park', '#E4F6D8'],
  ]

  for (const [layer, value] of tints) {
    if (!map.getLayer(layer)) continue
    try {
      map.setPaintProperty(layer, 'fill-color', value)
    } catch {
      /* fill 以外のレイヤだったら無視して次へ */
    }
  }
}
