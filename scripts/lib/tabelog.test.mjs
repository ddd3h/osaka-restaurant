import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { extractScore, formatRestaurantsJson, withRating } from './tabelog.mjs'

// vitest はプロジェクトルートで動くので cwd 基準。
// import.meta.url は vitest の変換後 file: スキームでなくなるため使えない。
const DATA = resolve(process.cwd(), 'src/data/restaurants.json')

describe('extractScore', () => {
  it('店舗ヘッダーの点数を拾う', () => {
    const html = '<span class="rdheader-rating__score-val-dtl">3.66</span>'
    expect(extractScore(html)).toBe(3.66)
  })

  it('ヘッダーが無ければ JSON-LD の先頭の ratingValue にフォールバックする', () => {
    // 2件目以降は個別レビューの点数なので拾ってはいけない
    const html = '{"ratingValue":"3.78"} … {"ratingValue":"4.5"}'
    expect(extractScore(html)).toBe(3.78)
  })

  it('点数が見つからなければ null', () => {
    expect(extractScore('<html>お探しのページが見つかりません</html>')).toBe(null)
  })

  it('1〜5 の外なら null（スクレイプが壊れた合図）', () => {
    expect(extractScore('<span class="rdheader-rating__score-val-dtl">35.0</span>')).toBe(null)
    expect(extractScore('<span class="rdheader-rating__score-val-dtl">0.5</span>')).toBe(null)
  })
})

describe('formatRestaurantsJson', () => {
  // これが通る限り、スクリプトが restaurants.json の整形を壊すことはない
  it('同梱データを1バイトも変えずに書き戻せる', () => {
    const raw = readFileSync(DATA, 'utf8')
    expect(formatRestaurantsJson(JSON.parse(raw))).toBe(raw)
  })

  it('文字列だけの配列は1行に畳む', () => {
    const out = formatRestaurantsJson([{ id: 'a', tags: ['粉モン', '安い'] }])
    expect(out).toContain('"tags": ["粉モン", "安い"]')
  })
})

describe('withRating', () => {
  it('既にあれば値だけ差し替え、キーの位置は動かさない', () => {
    const out = withRating({ id: 'a', budget: '¥1,000', rating: 5, address: '大阪' }, 3.66)
    expect(Object.keys(out)).toEqual(['id', 'budget', 'rating', 'address'])
    expect(out.rating).toBe(3.66)
  })

  it('無ければ budget の直後に入れる', () => {
    const out = withRating({ id: 'a', budget: '¥1,000', address: '大阪' }, 3.4)
    expect(Object.keys(out)).toEqual(['id', 'budget', 'rating', 'address'])
  })

  it('budget が無ければ comment の直後に入れる', () => {
    const out = withRating({ id: 'a', comment: 'うまい', address: '大阪' }, 3.4)
    expect(Object.keys(out)).toEqual(['id', 'comment', 'rating', 'address'])
  })

  it('入力を書き換えない', () => {
    const input = { id: 'a', budget: '¥1,000' }
    withRating(input, 3.4)
    expect(input).toEqual({ id: 'a', budget: '¥1,000' })
  })
})
