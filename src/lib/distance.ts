export type LatLng = { lat: number; lng: number }

const EARTH_RADIUS_M = 6371000
const WALK_METERS_PER_MINUTE = 80 // 不動産表記と同じ 80m/分

const toRad = (deg: number) => (deg * Math.PI) / 180

/** 2地点間の大円距離をメートルで返す。 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** 1km 未満は 10m 単位の m 表記、それ以上は小数第1位の km 表記。 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/** 徒歩の目安（分）。0m でも 1分と表示して「0分」を避ける。 */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / WALK_METERS_PER_MINUTE))
}
