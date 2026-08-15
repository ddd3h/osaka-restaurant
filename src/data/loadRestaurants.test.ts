import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRestaurants, prepare, toIndexed } from './loadRestaurants'
import type { Restaurant } from '../types'

const valid: Restaurant = {
  id: 'wanaka',
  name: 'たこ焼道楽 わなか',
  kana: 'たこやきどうらく わなか',
  tags: ['粉モン'],
  area: '難波',
  lat: 34.6656,
  lng: 135.5028,
  comment: 'ソースが濃い',
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('toIndexed', () => {
  it('name / kana / tags / area / comment を正規化して searchIndex に入れる', () => {
    const r = toIndexed(valid)
    expect(r.searchIndex).toContain('たこやきどうらく')
    // タグも正規化されるのでカタカナはひらがなになっている
    expect(r.searchIndex).toContain('粉もん')
    expect(r.searchIndex).toContain('難波')
    expect(r.searchIndex).toContain('そーすが濃い')
  })

  // src/photos/<id>/ が空の状態では photo へのフォールバックだけが効く。
  it('photo があれば gallery は BASE_URL 付きの 1 枚になる', () => {
    const r = toIndexed({ ...valid, photo: 'photos/wanaka.jpg' })
    expect(r.gallery).toEqual([`${import.meta.env.BASE_URL}photos/wanaka.jpg`])
  })

  it('photo が無ければ gallery は空', () => {
    expect(toIndexed(valid).gallery).toEqual([])
  })
})

describe('prepare', () => {
  it('正しいレコードは通す', () => {
    expect(prepare([valid])).toHaveLength(1)
  })

  it('id が重複したら後勝ちさせず、後のほうを落とす', () => {
    const out = prepare([valid, { ...valid, name: '別の店' }])
    expect(out).toHaveLength(1)
    expect(out[0].name).toBe('たこ焼道楽 わなか')
    expect(console.warn).toHaveBeenCalled()
  })

  it('必須項目が欠けたレコードは落とす', () => {
    const { name: _name, ...missingName } = valid
    expect(prepare([missingName])).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('大阪府の範囲外の座標は落とす', () => {
    expect(prepare([{ ...valid, lat: 35.68, lng: 139.76 }])).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('id にスラッグとして使えない文字が入っていたら落とす', () => {
    expect(prepare([{ ...valid, id: 'わなか 難波' }])).toEqual([])
  })

  it('rating が無くても通る（食べログにページが無い店）', () => {
    expect(prepare([valid])).toHaveLength(1)
  })

  it('rating が 1〜5 の外なら落とす', () => {
    expect(prepare([{ ...valid, rating: 0 }])).toEqual([])
    expect(prepare([{ ...valid, rating: 5.1 }])).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('rating が数値でなければ落とす', () => {
    expect(prepare([{ ...valid, rating: '3.66' }])).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('壊れたレコードがあっても他は生き残る', () => {
    const out = prepare([{ ...valid, id: 'ok' }, null, { ...valid, id: 'ok2' }])
    expect(out.map((r) => r.id)).toEqual(['ok', 'ok2'])
  })
})

describe('同梱データ', () => {
  it('サンプルが 10 件以上あり、すべて検証を通る', () => {
    const list = loadRestaurants()
    expect(list.length).toBeGreaterThanOrEqual(10)
  })

  it('id が一意', () => {
    const list = loadRestaurants()
    expect(new Set(list.map((r) => r.id)).size).toBe(list.length)
  })

  it('すべての店が最低 1 枚の写真を持つ', () => {
    for (const r of loadRestaurants()) {
      expect(r.gallery.length).toBeGreaterThanOrEqual(1)
    }
  })

  // rating は npm run ratings が書く。スクリプトが黙って何も書かなかったのを検知する。
  it('ほぼ全店に食べログ点数が入っていて、値は 1〜5 に収まる', () => {
    const list = loadRestaurants()
    const scored = list.filter((r) => r.rating !== undefined)
    expect(scored.length).toBeGreaterThanOrEqual(list.length - 2)
    for (const r of scored) {
      expect(Number.isFinite(r.rating)).toBe(true)
      expect(r.rating).toBeGreaterThanOrEqual(1)
      expect(r.rating).toBeLessThanOrEqual(5)
    }
  })

  it('タグが十分に散っている（フィルターが意味を持つ）', () => {
    const tags = new Set(loadRestaurants().flatMap((r) => r.tags))
    expect(tags.size).toBeGreaterThanOrEqual(6)
    expect(tags.has('粉モン')).toBe(true)
    expect(tags.has('大阪ぽい')).toBe(true)
  })
})
