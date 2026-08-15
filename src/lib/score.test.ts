import { describe, expect, it } from 'vitest'
import { formatScore } from './score'

describe('formatScore', () => {
  it('小数第2位まで必ず出す', () => {
    // JSON は 3.50 を 3.5 として読むので、ここで桁を戻さないと表示が揃わない
    expect(formatScore(3.5)).toBe('3.50')
    expect(formatScore(4)).toBe('4.00')
  })

  it('もともと2桁ならそのまま', () => {
    expect(formatScore(3.66)).toBe('3.66')
    expect(formatScore(3.04)).toBe('3.04')
  })
})
