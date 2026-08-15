import { useCallback, useState } from 'react'
import type { LatLng } from '../lib/distance'

export type GeoStatus = 'idle' | 'locating' | 'granted' | 'error'

export type Geolocation = {
  status: GeoStatus
  position: LatLng | null
  error: string | null
  /** ユーザーが「近い順」を押したときだけ呼ぶ。読み込み時に勝手に許可を求めない。 */
  request: () => void
}

function describe(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '位置情報の利用が許可されませんでした'
    case error.POSITION_UNAVAILABLE:
      return '現在地を取得できませんでした'
    case error.TIMEOUT:
      return '現在地の取得がタイムアウトしました'
    default:
      return '現在地を取得できませんでした'
  }
}

export function useGeolocation(): Geolocation {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [position, setPosition] = useState<LatLng | null>(null)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('error')
      setError('この端末では現在地を取得できません')
      return
    }

    setStatus('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        setStatus('granted')
      },
      (err) => {
        setError(describe(err))
        setStatus('error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }, [])

  return { status, position, error, request }
}
