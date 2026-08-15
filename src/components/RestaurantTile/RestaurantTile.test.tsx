import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RestaurantTile } from './RestaurantTile'
import { makeRestaurant } from '../../test/fixtures'
import type { ListedRestaurant } from '../../types'

const noop = () => {}

function renderTile(
  restaurant: ListedRestaurant,
  over: Partial<{
    onSelect: (id: string) => void
    onToggleFavorite: (id: string) => void
  }> = {},
) {
  return render(
    <RestaurantTile
      restaurant={restaurant}
      selected={false}
      favorite={false}
      onSelect={over.onSelect ?? noop}
      onHover={noop}
      onToggleFavorite={over.onToggleFavorite ?? noop}
    />,
  )
}

describe('RestaurantTile', () => {
  it('gallery に写真があれば img を出し、その src は gallery の1枚目', () => {
    // photo を渡すと fixtures 側の toIndexed() が gallery を1枚ぶん組み立てる
    const r = makeRestaurant({ photo: 'photos/wanaka.svg' })
    const { container } = renderTile(r)

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe(r.gallery[0])
  })

  it('写真が無ければ img を出さない', () => {
    const { container } = renderTile(makeRestaurant({ photo: undefined }))

    expect(container.querySelector('img')).toBeNull()
  })

  it('店名・エリア・タグを表示する', () => {
    const r = makeRestaurant({
      name: 'たこ焼き ぐるぐる',
      area: '天満',
      tags: ['粉モン', '安い'],
    })
    renderTile(r)

    expect(screen.getByRole('heading', { name: 'たこ焼き ぐるぐる' })).toBeInTheDocument()
    expect(screen.getByText('天満')).toBeInTheDocument()
    expect(screen.getByText('粉モン')).toBeInTheDocument()
    expect(screen.getByText('安い')).toBeInTheDocument()
  })

  it('♡ を押すと onToggleFavorite が id 付きで呼ばれる', async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    const r = makeRestaurant({ name: 'いろは食堂' })
    renderTile(r, { onToggleFavorite })

    await user.click(screen.getByRole('button', { name: /お気に入りに追加/ }))

    expect(onToggleFavorite).toHaveBeenCalledWith(r.id)
  })

  it('タイル本体を押すと onSelect が id 付きで呼ばれる', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const r = makeRestaurant({ name: 'いろは食堂' })
    renderTile(r, { onSelect })

    await user.click(screen.getByRole('button', { name: /の詳細を見る$/ }))

    expect(onSelect).toHaveBeenCalledWith(r.id)
  })
})
