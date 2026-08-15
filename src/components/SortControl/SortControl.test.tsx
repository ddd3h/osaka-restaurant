import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SortControl } from './SortControl'
import type { SortKey } from '../../types'

function renderControl(sort: SortKey, onSortChange = () => {}) {
  return render(
    <SortControl
      sort={sort}
      onSortChange={onSortChange}
      favoritesOnly={false}
      onFavoritesOnlyChange={() => {}}
      favoriteCount={0}
      geoStatus="idle"
      geoError={null}
    />,
  )
}

// 見た目は「食べログ順」だが、点数 が srOnly で入るので読み上げ名は「食べログ点数順」
const scoreButton = () => screen.getByRole('button', { name: '食べログ点数順' })

describe('SortControl', () => {
  it('並び順は3つ', () => {
    renderControl('recommended')
    const group = screen.getByRole('group', { name: '並び順' })
    expect(group.querySelectorAll('button')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'おすすめ順' })).toBeInTheDocument()
    expect(scoreButton()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '近い順' })).toBeInTheDocument()
  })

  it('選択中のものだけ押された状態になる', () => {
    renderControl('score')
    expect(scoreButton()).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'おすすめ順' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('食べログ点数順を押すと score で通知する', async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    renderControl('recommended', onSortChange)

    await user.click(scoreButton())

    expect(onSortChange).toHaveBeenCalledTimes(1)
    expect(onSortChange).toHaveBeenCalledWith('score')
  })
})
