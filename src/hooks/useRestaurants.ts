import { useMemo } from 'react'
import { loadRestaurants } from '../data/loadRestaurants'
import { haversineMeters, type LatLng } from '../lib/distance'
import type { ListedRestaurant } from '../types'

/**
 * 同梱データを読み、現在地があれば距離を付けて返す。
 * 現在地が null のうちは distanceM は undefined のまま。
 */
export function useRestaurants(origin: LatLng | null): ListedRestaurant[] {
  const base = useMemo(() => loadRestaurants(), [])

  return useMemo(() => {
    if (!origin) return base
    return base.map((r) => ({
      ...r,
      distanceM: haversineMeters(origin, { lat: r.lat, lng: r.lng }),
    }))
  }, [base, origin])
}
