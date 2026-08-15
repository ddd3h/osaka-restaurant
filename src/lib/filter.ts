import type { FilterCriteria, IndexedRestaurant, ListedRestaurant, SortKey } from '../types'
import { tokenize } from './normalize'

/**
 * 検索語・タグ・お気に入りで絞り込む。
 * 検索語のトークン同士も、選択タグ同士も AND（絞り込みが目的なので）。
 */
export function filterRestaurants<T extends IndexedRestaurant>(
  list: readonly T[],
  criteria: FilterCriteria,
): T[] {
  const tokens = tokenize(criteria.query)

  return list.filter((r) => {
    if (criteria.favoritesOnly && !criteria.favorites.has(r.id)) return false
    if (!criteria.tags.every((tag) => r.tags.includes(tag))) return false
    return tokens.every((token) => r.searchIndex.includes(token))
  })
}

/** タグの出現数を数え、多い順（同数ならタグ名順）の Map にして返す。 */
export function tagCounts(list: readonly IndexedRestaurant[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const r of list) {
    for (const tag of r.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return new Map(
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja')),
  )
}

/** 並べ替え。元配列は破壊しない。 */
export function sortRestaurants<T extends ListedRestaurant>(
  list: readonly T[],
  key: SortKey,
): T[] {
  const sorted = [...list]

  if (key === 'nearest') {
    // 距離未計測（現在地拒否など）は末尾へ
    return sorted.sort(
      (a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity),
    )
  }

  if (key === 'score') {
    // 点数の無い店（食べログにページが無い）は末尾へ。同点は JSON に書いた順のまま（Array#sort は安定）。
    // 番兵に -Infinity ではなく -1 を使うのは、両方 undefined のとき差が NaN になって
    // 比較関数が壊れるのを避けるため。rating は 1 以上なので -1 は必ず下に来る。
    return sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))
  }

  // おすすめ順 = restaurants.json に書いた順そのもの。
  // 並べ替えたいときは JSON のレコードごと動かす。ここでは並べ替えない。
  return sorted
}
