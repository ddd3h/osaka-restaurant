import { describe, expect, it } from 'vitest'
import { formatDistance, haversineMeters, walkMinutes } from './distance'

// 難波駅 と 梅田駅（実測でおよそ 4.1km）
const NAMBA = { lat: 34.666, lng: 135.501 }
const UMEDA = { lat: 34.7025, lng: 135.4959 }

describe('haversineMeters', () => {
  it('同じ地点は 0', () => {
    expect(haversineMeters(NAMBA, NAMBA)).toBe(0)
  })

  it('難波〜梅田はおよそ 4.1km', () => {
    const d = haversineMeters(NAMBA, UMEDA)
    expect(d).toBeGreaterThan(3900)
    expect(d).toBeLessThan(4300)
  })

  it('向きを入れ替えても同じ距離', () => {
    expect(haversineMeters(NAMBA, UMEDA)).toBeCloseTo(haversineMeters(UMEDA, NAMBA), 6)
  })
})

describe('formatDistance', () => {
  it('1km 未満は m 表記（10m 単位に丸める）', () => {
    expect(formatDistance(0)).toBe('0m')
    expect(formatDistance(954)).toBe('950m')
  })

  it('1km 以上は km 表記（小数第1位）', () => {
    expect(formatDistance(1000)).toBe('1.0km')
    expect(formatDistance(4089)).toBe('4.1km')
  })
})

describe('walkMinutes', () => {
  it('分速 80m で切り上げる', () => {
    expect(walkMinutes(80)).toBe(1)
    expect(walkMinutes(950)).toBe(12)
  })

  it('0m でも 1分未満は 1分として出す', () => {
    expect(walkMinutes(0)).toBe(1)
  })
})
