import { describe, expect, it } from 'vitest'
import { TAG_PALETTE_SIZE, tagColor, tagColorIndex } from './tagColor'

describe('tagColorIndex', () => {
  it('同じタグは常に同じ index になる', () => {
    expect(tagColorIndex('粉モン')).toBe(tagColorIndex('粉モン'))
  })

  it('必ずパレットの範囲に収まる', () => {
    const tags = ['粉モン', '大阪ぽい', '一人OK', '深夜', '行列覚悟', '安い', '映え', '甘い', 'レトロ', '🍜']
    for (const t of tags) {
      const i = tagColorIndex(t)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(TAG_PALETTE_SIZE)
    }
  })

  it('空文字でも落ちない', () => {
    expect(tagColorIndex('')).toBe(0)
  })
})

describe('tagColor', () => {
  it('CSS カスタムプロパティ参照を返す', () => {
    expect(tagColor('粉モン')).toMatch(/^var\(--tag-\d\)$/)
  })
})
