import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useViewMode } from './useViewMode'

const KEY = 'osaka-view-v1'

/** 別タブでの書き換えを模して storage イベントを飛ばす。 */
function fireStorage(newValue: string | null) {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue }))
  })
}

describe('useViewMode', () => {
  it('既定は地図モード', () => {
    const { result } = renderHook(() => useViewMode())

    expect(result.current.mode).toBe('map')
  })

  it('setMode で切り替わり、再マウントしても復元される', () => {
    const first = renderHook(() => useViewMode())

    act(() => first.result.current.setMode('grid'))
    expect(first.result.current.mode).toBe('grid')

    first.unmount()

    const again = renderHook(() => useViewMode())
    expect(again.result.current.mode).toBe('grid')
  })

  it('地図モードに戻したものも保存される', () => {
    const { result, unmount } = renderHook(() => useViewMode())

    act(() => result.current.setMode('grid'))
    act(() => result.current.setMode('map'))
    unmount()

    expect(renderHook(() => useViewMode()).result.current.mode).toBe('map')
  })

  it('知らない値が保存されていても既定値に落ちる', () => {
    localStorage.setItem(KEY, '"banana"')

    expect(renderHook(() => useViewMode()).result.current.mode).toBe('map')
  })

  it('壊れたJSONが保存されていても落ちずに既定値になる', () => {
    localStorage.setItem(KEY, '{oops')

    expect(renderHook(() => useViewMode()).result.current.mode).toBe('map')
  })

  it('setMode は再レンダーをまたいで同じ関数のまま', () => {
    const { result, rerender } = renderHook(() => useViewMode())
    const before = result.current.setMode

    act(() => result.current.setMode('grid'))
    rerender()

    expect(result.current.setMode).toBe(before)
  })

  it('別タブで変更されると storage イベントで追従する', () => {
    const { result } = renderHook(() => useViewMode())

    localStorage.setItem(KEY, '"grid"')
    fireStorage('"grid"')

    expect(result.current.mode).toBe('grid')
  })

  it('別タブで壊れた値が入った場合も既定値に戻すだけ', () => {
    const { result } = renderHook(() => useViewMode())

    act(() => result.current.setMode('grid'))
    localStorage.setItem(KEY, 'null')
    fireStorage('null')

    expect(result.current.mode).toBe('map')
  })

  it('unmount 後は storage イベントを受け取らない', () => {
    const { result, unmount } = renderHook(() => useViewMode())
    unmount()

    localStorage.setItem(KEY, '"grid"')
    // 購読が外れていれば、この dispatch で警告も更新も起きない
    fireStorage('"grid"')

    expect(result.current.mode).toBe('map')
  })
})
