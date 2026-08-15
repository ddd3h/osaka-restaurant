import { describe, expect, it } from 'vitest'
import { buildPhotoCatalog, idFromGlobKey, photosFor, sortByNaturalName } from './photos'

describe('idFromGlobKey', () => {
  it('末尾から 2 番目のセグメントを店 id として取り出す', () => {
    expect(idFromGlobKey('../photos/kiji-honten/01.jpg')).toBe('kiji-honten')
  })

  it('Vite がキーを絶対パスで返しても同じ id になる', () => {
    expect(idFromGlobKey('/src/photos/kiji-honten/01.jpg')).toBe('kiji-honten')
    expect(idFromGlobKey('/Users/me/app/src/photos/kiji-honten/01.jpg')).toBe('kiji-honten')
  })

  it('フォルダを挟まないパスは id なしとして扱う', () => {
    expect(idFromGlobKey('01.jpg')).toBeUndefined()
  })
})

describe('sortByNaturalName', () => {
  it('ファイル名を数値として比較する（2.jpg は 10.jpg より前）', () => {
    const sorted = sortByNaturalName([
      '../photos/a/10.jpg',
      '../photos/a/2.jpg',
      '../photos/a/1.jpg',
    ])
    expect(sorted).toEqual(['../photos/a/1.jpg', '../photos/a/2.jpg', '../photos/a/10.jpg'])
  })

  it('ゼロ埋めと素の数字が混ざっていても順番どおりに並ぶ', () => {
    expect(sortByNaturalName(['b/img12.webp', 'b/img2.webp', 'b/img03.webp'])).toEqual([
      'b/img2.webp',
      'b/img03.webp',
      'b/img12.webp',
    ])
  })

  it('入力配列は書き換えない', () => {
    const input = ['a/3.jpg', 'a/1.jpg']
    sortByNaturalName(input)
    expect(input).toEqual(['a/3.jpg', 'a/1.jpg'])
  })
})

describe('buildPhotoCatalog', () => {
  it('店ごとにまとめ、ファイル名の自然順で URL を並べる', () => {
    const catalog = buildPhotoCatalog({
      '../photos/kiji/10.jpg': '/assets/kiji-10.hash.jpg',
      '../photos/kiji/2.jpg': '/assets/kiji-2.hash.jpg',
      '../photos/teru/01.png': '/assets/teru-01.hash.png',
    })

    expect(catalog.kiji).toEqual(['/assets/kiji-2.hash.jpg', '/assets/kiji-10.hash.jpg'])
    expect(catalog.teru).toEqual(['/assets/teru-01.hash.png'])
  })

  it('写真が 1 枚も無ければ空のカタログになる', () => {
    expect(buildPhotoCatalog({})).toEqual({})
  })
})

describe('photosFor', () => {
  it('写真フォルダが無い id は空配列を返す', () => {
    expect(photosFor('そんな店はない')).toEqual([])
  })

  it('返した配列を書き換えても次の呼び出しには影響しない', () => {
    const first = photosFor('kiji-honten')
    first.push('/assets/勝手に足した.jpg')
    expect(photosFor('kiji-honten')).not.toContain('/assets/勝手に足した.jpg')
  })
})
