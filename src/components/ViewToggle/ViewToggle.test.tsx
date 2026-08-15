import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ViewToggle } from './ViewToggle'

const mapButton = () => screen.getByRole('button', { name: '地図表示' })
const gridButton = () => screen.getByRole('button', { name: 'グリッド表示' })

describe('ViewToggle', () => {
  it('地図モードのときは地図ボタンだけが押された状態', () => {
    render(<ViewToggle mode="map" onChange={() => {}} />)

    expect(mapButton()).toHaveAttribute('aria-pressed', 'true')
    expect(gridButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('グリッドモードのときはグリッドボタンだけが押された状態', () => {
    render(<ViewToggle mode="grid" onChange={() => {}} />)

    expect(gridButton()).toHaveAttribute('aria-pressed', 'true')
    expect(mapButton()).toHaveAttribute('aria-pressed', 'false')
  })

  it('グリッドを押すと grid で1回だけ通知する', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewToggle mode="map" onChange={onChange} />)

    await user.click(gridButton())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('grid')
  })

  it('地図を押すと map で1回だけ通知する', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewToggle mode="grid" onChange={onChange} />)

    await user.click(mapButton())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('map')
  })

  it('フォームの中に置いても送信しないよう type="button" になっている', () => {
    render(<ViewToggle mode="map" onChange={() => {}} />)

    expect(mapButton()).toHaveAttribute('type', 'button')
    expect(gridButton()).toHaveAttribute('type', 'button')
  })

  it('グループとして名前が付いていて、アイコンは読み上げられない', () => {
    const { container } = render(<ViewToggle mode="map" onChange={() => {}} />)

    const group = screen.getByRole('group', { name: '表示の切り替え' })
    expect(group).toBeInTheDocument()

    // アイコンは飾り。名前は srOnly のテキストと title が持つ
    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(2)
    for (const icon of icons) {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
