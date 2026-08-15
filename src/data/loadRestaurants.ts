import type { IndexedRestaurant, Restaurant } from '../types'
import { assetUrl } from '../lib/assetUrl'
import { normalize } from '../lib/normalize'
import { photosFor } from './photos'
import rawData from './restaurants.json'

/** 大阪府のだいたいの外接矩形。ここから外れた座標は入力ミスとみなす。 */
const OSAKA_BOUNDS = { minLat: 34.2, maxLat: 35.0, minLng: 135.0, maxLng: 135.8 }
const ID_PATTERN = /^[a-z0-9-]+$/

/** 検索対象の文字列をまとめて正規化し、searchIndex と gallery を持たせる。 */
export function toIndexed(r: Restaurant): IndexedRestaurant {
  const searchIndex = normalize(
    [r.name, r.kana ?? '', r.tags.join(' '), r.area, r.comment, r.address ?? ''].join(' '),
  )
  return { ...r, searchIndex, gallery: galleryFor(r) }
}

/**
 * 表示に使う写真 URL を決める。
 * src/photos/<id>/ の写真を最優先し、無ければ photo 1 枚、どちらも無ければ空。
 */
function galleryFor(r: Restaurant): string[] {
  // Vite が解決済みの URL なので assetUrl は通さない。
  const folder = photosFor(r.id)
  if (folder.length > 0) return folder

  // photo は public/ 配下なので BASE_URL を前置する必要がある。
  const fallback = assetUrl(r.photo)
  return fallback ? [fallback] : []
}

/**
 * 生データを検証して IndexedRestaurant[] にする。
 * 壊れたレコードは警告して捨てるだけで、サイト全体は落とさない。
 */
export function prepare(records: readonly unknown[]): IndexedRestaurant[] {
  const seen = new Set<string>()
  const out: IndexedRestaurant[] = []

  records.forEach((record, i) => {
    const problem = validate(record)
    if (problem) {
      console.warn(`restaurants.json[${i}] を読み飛ばしました: ${problem}`, record)
      return
    }

    const restaurant = record as Restaurant
    if (seen.has(restaurant.id)) {
      console.warn(`restaurants.json[${i}] は id が重複しています: ${restaurant.id}`)
      return
    }

    seen.add(restaurant.id)
    out.push(toIndexed(restaurant))
  })

  return out
}

/** 問題があればその説明を、なければ null を返す。 */
function validate(record: unknown): string | null {
  if (typeof record !== 'object' || record === null) return 'オブジェクトではありません'
  const r = record as Record<string, unknown>

  for (const key of ['id', 'name', 'emoji', 'area', 'comment'] as const) {
    if (typeof r[key] !== 'string' || r[key] === '') return `${key} が空です`
  }
  if (!ID_PATTERN.test(r.id as string)) return 'id は半角英小文字・数字・ハイフンのみ'
  if (!Array.isArray(r.tags) || r.tags.some((t) => typeof t !== 'string')) {
    return 'tags は文字列の配列である必要があります'
  }

  const { lat, lng } = r
  if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
    return 'lat / lng が数値ではありません'
  }
  if (lat < OSAKA_BOUNDS.minLat || lat > OSAKA_BOUNDS.maxLat) return `lat が大阪の範囲外: ${lat}`
  if (lng < OSAKA_BOUNDS.minLng || lng > OSAKA_BOUNDS.maxLng) return `lng が大阪の範囲外: ${lng}`

  if (r.rating !== undefined && (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5)) {
    return 'rating は 1〜5 の数値'
  }

  return null
}

let cache: IndexedRestaurant[] | null = null

/** 同梱の restaurants.json を読み込む（1回だけ検証して以降は使い回す）。 */
export function loadRestaurants(): IndexedRestaurant[] {
  cache ??= prepare(rawData as unknown[])
  return cache
}
