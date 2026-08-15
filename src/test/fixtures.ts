import { toIndexed } from '../data/loadRestaurants'
import type { IndexedRestaurant, Restaurant } from '../types'

let seq = 0

/** テスト用の Restaurant を最小の指定で作る。 */
export function makeRestaurant(over: Partial<Restaurant> = {}): IndexedRestaurant {
  seq += 1
  return toIndexed({
    id: `r${seq}`,
    name: `テスト店${seq}`,
    emoji: '🍚',
    tags: [],
    area: '難波',
    lat: 34.666,
    lng: 135.501,
    comment: 'おいしい',
    ...over,
  })
}
