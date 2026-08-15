import { describe, expect, it } from 'vitest'
import { makeRestaurant } from '../test/fixtures'
import { filterRestaurants, sortRestaurants, tagCounts } from './filter'
import type { FilterCriteria } from '../types'

const noFilter: FilterCriteria = {
  query: '',
  tags: [],
  favoritesOnly: false,
  favorites: new Set<string>(),
}

const wanaka = makeRestaurant({
  id: 'wanaka',
  name: 'たこ焼道楽 わなか',
  kana: 'たこやきどうらく わなか',
  tags: ['粉モン', '大阪ぽい', '安い'],
  area: '難波',
  rating: 3.85,
})
const daruma = makeRestaurant({
  id: 'daruma',
  name: '串カツだるま',
  kana: 'くしかつだるま',
  tags: ['大阪ぽい', '一人OK'],
  area: '新世界',
  rating: 3.06,
})
const chitose = makeRestaurant({
  id: 'chitose',
  name: '千とせ',
  kana: 'ちとせ',
  tags: ['一人OK', '行列覚悟'],
  area: '難波',
  rating: 3.72,
  comment: '肉吸いの元祖',
})

const all = [wanaka, daruma, chitose]

describe('filterRestaurants — 検索語', () => {
  it('検索語が空なら全件返す', () => {
    expect(filterRestaurants(all, noFilter)).toHaveLength(3)
  })

  it('カタカナで打っても漢字かなの店にヒットする', () => {
    const hit = filterRestaurants(all, { ...noFilter, query: 'タコヤキ' })
    expect(hit.map((r) => r.id)).toEqual(['wanaka'])
  })

  it('半角カナでもヒットする', () => {
    const hit = filterRestaurants(all, { ...noFilter, query: 'ｸｼｶﾂ' })
    expect(hit.map((r) => r.id)).toEqual(['daruma'])
  })

  it('エリア名でもヒットする', () => {
    const hit = filterRestaurants(all, { ...noFilter, query: '難波' })
    expect(hit.map((r) => r.id).sort()).toEqual(['chitose', 'wanaka'])
  })

  it('コメント本文でもヒットする', () => {
    const hit = filterRestaurants(all, { ...noFilter, query: '肉吸い' })
    expect(hit.map((r) => r.id)).toEqual(['chitose'])
  })

  it('スペース区切りは AND で絞る', () => {
    const hit = filterRestaurants(all, { ...noFilter, query: '難波 たこ' })
    expect(hit.map((r) => r.id)).toEqual(['wanaka'])
  })

  it('どれにも当たらなければ空配列', () => {
    expect(filterRestaurants(all, { ...noFilter, query: 'すし' })).toEqual([])
  })
})

describe('filterRestaurants — タグ', () => {
  it('単一タグで絞る', () => {
    const hit = filterRestaurants(all, { ...noFilter, tags: ['大阪ぽい'] })
    expect(hit.map((r) => r.id).sort()).toEqual(['daruma', 'wanaka'])
  })

  it('複数タグは AND', () => {
    const hit = filterRestaurants(all, { ...noFilter, tags: ['大阪ぽい', '一人OK'] })
    expect(hit.map((r) => r.id)).toEqual(['daruma'])
  })

  it('両立しないタグの組み合わせは 0 件', () => {
    const hit = filterRestaurants(all, { ...noFilter, tags: ['粉モン', '行列覚悟'] })
    expect(hit).toEqual([])
  })

  it('タグと検索語は併用できる', () => {
    const hit = filterRestaurants(all, { ...noFilter, tags: ['一人OK'], query: '難波' })
    expect(hit.map((r) => r.id)).toEqual(['chitose'])
  })
})

describe('filterRestaurants — お気に入り', () => {
  it('お気に入りのみで絞る', () => {
    const hit = filterRestaurants(all, {
      ...noFilter,
      favoritesOnly: true,
      favorites: new Set(['daruma']),
    })
    expect(hit.map((r) => r.id)).toEqual(['daruma'])
  })

  it('トグルが off ならお気に入り集合は無視する', () => {
    const hit = filterRestaurants(all, { ...noFilter, favorites: new Set(['daruma']) })
    expect(hit).toHaveLength(3)
  })
})

describe('tagCounts', () => {
  it('出現数を数えて多い順に並べる', () => {
    const counts = tagCounts(all)
    expect(counts.get('大阪ぽい')).toBe(2)
    expect(counts.get('一人OK')).toBe(2)
    expect(counts.get('粉モン')).toBe(1)
    // 多い順が先頭に来る
    expect([...counts.values()][0]).toBe(2)
  })

  it('タグなしの店だけなら空', () => {
    expect(tagCounts([makeRestaurant({ tags: [] })]).size).toBe(0)
  })
})

describe('sortRestaurants', () => {
  it('おすすめ順は JSON に書いた順のまま', () => {
    expect(sortRestaurants(all, 'recommended').map((r) => r.id)).toEqual([
      'wanaka',
      'daruma',
      'chitose',
    ])
  })

  it('点数順は食べログ点数の高い順', () => {
    expect(sortRestaurants(all, 'score').map((r) => r.id)).toEqual([
      'wanaka',
      'chitose',
      'daruma',
    ])
  })

  it('点数順で点数の無い店は末尾へ', () => {
    const noScore = makeRestaurant({ id: 'noscore' })
    const sorted = sortRestaurants([noScore, ...all], 'score')
    expect(sorted[sorted.length - 1].id).toBe('noscore')
  })

  it('点数順で同点なら JSON に書いた順のまま', () => {
    const a = makeRestaurant({ id: 'a', rating: 3.5 })
    const b = makeRestaurant({ id: 'b', rating: 3.5 })
    expect(sortRestaurants([a, b], 'score').map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('近い順は distanceM の小さい順、未計測は末尾', () => {
    const withDist = [
      { ...wanaka, distanceM: 3000 },
      { ...daruma, distanceM: undefined },
      { ...chitose, distanceM: 500 },
    ]
    const sorted = sortRestaurants(withDist, 'nearest')
    expect(sorted.map((r) => r.id)).toEqual(['chitose', 'wanaka', 'daruma'])
  })

  it('元の配列を破壊しない', () => {
    const input = [...all]
    sortRestaurants(input, 'recommended')
    expect(input.map((r) => r.id)).toEqual(['wanaka', 'daruma', 'chitose'])
    // おすすめ順は並べ替えないが、コピーは返す（呼び出し側が結果を破壊しても安全なように）
    expect(sortRestaurants(input, 'recommended')).not.toBe(input)
  })
})
