import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RestaurantCard } from './RestaurantCard'
import { makeRestaurant } from '../../test/fixtures'
import type { ListedRestaurant } from '../../types'

const noop = () => {}

function renderCard(restaurant: ListedRestaurant) {
  return render(
    <RestaurantCard
      restaurant={restaurant}
      selected={false}
      favorite={false}
      onSelect={noop}
      onHover={noop}
      onToggleFavorite={noop}
    />,
  )
}

describe('RestaurantCard のサムネ', () => {
  it('gallery に写真があれば写真を出す', () => {
    // photo を渡すと fixtures 側の toIndexed() が gallery を1枚ぶん組み立てる
    const { container } = renderCard(makeRestaurant({ photo: 'photos/wanaka.svg' }))

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toContain('photos/wanaka.svg')
  })

  it('gallery が空なら img を出さない', () => {
    const { container } = renderCard(makeRestaurant({ photo: undefined }))

    expect(container.querySelector('img')).toBeNull()
  })

  it('gallery の URL は BASE_URL 付きで解決済みのものが使われる', () => {
    const { container } = renderCard(makeRestaurant({ photo: 'photos/a.svg' }))

    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      `${import.meta.env.BASE_URL}photos/a.svg`,
    )
  })

  it('gallery が複数枚あっても、カードは縮小版を1枚だけ使う', () => {
    // カードのサムネは 92px 角なので原寸は要らない。
    // 複数枚と原寸を扱うのは DetailPanel 側の仕事。
    const { container } = renderCard({
      ...makeRestaurant(),
      cover: '/thumbs/first.webp',
      gallery: ['/photos/first.jpg', '/photos/second.jpg'],
    })

    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(1)
    expect(imgs[0]?.getAttribute('src')).toBe('/thumbs/first.webp')
  })
})

describe('RestaurantCard の食べログ点数', () => {
  it('小数第2位まで揃えて出す', () => {
    // JSON では 3.5 として読まれる値。★3.5 と ★3.66 が混ざらないこと
    renderCard(makeRestaurant({ rating: 3.5 }))
    expect(screen.getByText('3.50')).toBeInTheDocument()
  })

  it('点数が無ければ ★ ごと出さない', () => {
    const { container } = renderCard(makeRestaurant({}))
    expect(container.textContent).not.toContain('★')
  })
})
